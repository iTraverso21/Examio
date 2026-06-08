import sqlite3
import time
import re
import string
import cloudscraper
from bs4 import BeautifulSoup

import os
from dotenv import load_dotenv

# ==========================================
# CONFIGURACIÓN GENERAL
# ==========================================
# Cargamos las variables de entorno desde el archivo .env.local (ahora en la carpeta superior)
ruta_env = os.path.join(os.path.dirname(__file__), "..", ".env.local")
load_dotenv(ruta_env)

DB_NAME = os.getenv("DB_NAME", "examio_cursos.db")
SEMESTRE_ACTUAL = os.getenv("SEMESTRE_ACTUAL", "2026-1")

# ==========================================
# CAPA DE BASE DE DATOS (SQLite)
# ==========================================
def inicializar_db():
    """Crea la base de datos y la tabla si no existen."""
    # Usamos 'with' para asegurar que la conexión se cierre correctamente incluso si hay errores
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cursos (
                nrc TEXT PRIMARY KEY,
                sigla TEXT,
                seccion TEXT,
                nombre TEXT,
                profesor TEXT,
                horario TEXT,
                escuela TEXT,
                semestre TEXT
            )
        ''')
        conn.commit()
    print("✅ Base de datos inicializada correctamente.")

def guardar_cursos(lista_cursos):
    """Guarda una lista de diccionarios de cursos en la BD, ignorando duplicados (por NRC)."""
    if not lista_cursos:
        return
        
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.executemany('''
            INSERT OR IGNORE INTO cursos (nrc, sigla, seccion, nombre, profesor, horario, escuela, semestre)
            VALUES (:nrc, :sigla, :seccion, :nombre, :profesor, :horario, :escuela, :semestre)
        ''', lista_cursos)
        agregados = cursor.rowcount
        conn.commit()
        
    print(f"💾 Se guardaron/actualizaron {len(lista_cursos)} cursos en la base de datos (Nuevos: {agregados}).")

# ==========================================
# CAPA DE RED Y EXTRACCIÓN (Scraping)
# ==========================================
def obtener_escuelas(semestre):
    """Hace una petición rápida para extraer la lista de todas las escuelas disponibles."""
    print("🔍 Obteniendo lista de Escuelas (Unidades Académicas)...")
    scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False})
    
    url = "https://buscacursos.uc.cl/"
    params = {"cxml_semestre": semestre}
    
    try:
        response = scraper.get(url, params=params, timeout=15)
        if response.status_code != 200:
            print("❌ Error al cargar la página principal.")
            return []
    except Exception as e:
        print(f"❌ Error de conexión crítico al obtener escuelas: {e}")
        return []
        
    soup = BeautifulSoup(response.text, "html.parser")
    # El selector de escuela tiene el name="cxml_unidad_academica"
    select_escuela = soup.find("select", {"name": "cxml_unidad_academica"})
    
    escuelas = []
    if select_escuela:
        opciones = select_escuela.find_all("option")
        for op in opciones:
            valor = op.get("value", "").strip()
            nombre = op.text.strip()
            # Ignoramos la opción por defecto que dice "-- Todas --" o está vacía
            # NOTA: Solo filtramos por '--' y que el valor no esté vacío.
            if valor and "--" not in nombre:
                escuelas.append({"valor": valor, "nombre": nombre})
                
    print(f"✅ Se encontraron {len(escuelas)} escuelas.")
    return escuelas

def buscar_cursos(semestre, escuela_valor, escuela_nombre, prefijo_sigla=""):
    """
    Realiza la búsqueda en Buscacursos.
    Retorna una tupla: (estado, lista_de_cursos)
    Estado puede ser: 'EXITO', 'MUCHOS_RESULTADOS', 'SIN_RESULTADOS', 'ERROR'
    """
    # Pausa de 1 segundo para Scraping Educado (no saturar el servidor)
    time.sleep(1)
    
    url = "https://buscacursos.uc.cl/"
    params = {
        "cxml_semestre": semestre,
        "cxml_unidad_academica": escuela_valor,
        "cxml_sigla": prefijo_sigla
    }
    
    scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False})
    
    try:
        response = scraper.get(url, params=params, timeout=15)
        if response.status_code != 200:
            return 'ERROR', []
    except Exception as e:
        return 'ERROR', []

    soup = BeautifulSoup(response.text, "html.parser")
    
    # 1. Verificar si explotó el límite de 500 resultados
    texto_pagina = soup.text
    if "La búsqueda produjo demasiados resultados" in texto_pagina or "500 resultados" in texto_pagina:
        return 'MUCHOS_RESULTADOS', []
        
    # 2. Extraer filas de la tabla
    filas = soup.find_all("tr")
    cursos_encontrados = []
    
    for fila in filas:
        columnas = fila.find_all("td")
        if len(columnas) > 10:
            nrc = columnas[0].text.strip()
            if not nrc.isdigit():
                continue
                
            sigla = columnas[1].text.strip()
            seccion = columnas[4].text.strip()
            nombre = columnas[9].text.strip()
            profesor = columnas[10].text.strip().replace('\n', ' ')
            
            horario_bruto = columnas[16].text.strip()
            horario = re.sub(r'\s+', ' ', horario_bruto).strip()
            
            cursos_encontrados.append({
                "nrc": nrc,
                "sigla": sigla,
                "seccion": seccion,
                "nombre": nombre,
                "profesor": profesor,
                "horario": horario,
                "escuela": escuela_nombre,
                "semestre": semestre
            })
            
    if not cursos_encontrados:
        return 'SIN_RESULTADOS', []
        
    return 'EXITO', cursos_encontrados

# ==========================================
# CAPA LÓGICA (Divide y Vencerás)
# ==========================================
def explorar_escuela(semestre, escuela_valor, escuela_nombre, prefijo_sigla=""):
    """
    Función recursiva: Intenta buscar. Si hay más de 500 resultados, 
    se divide en 26 búsquedas más pequeñas agregando letras (A-Z).
    """
    # SENIOR REVIEW: Límite de seguridad para evitar recursión infinita (Stack Overflow)
    # Aumentado a 5 porque las siglas de ramos suelen tener 3 letras + números (ej. MAT1610)
    if len(prefijo_sigla) >= 5:
        print(f"   ⚠️ Límite de seguridad alcanzado para '{prefijo_sigla}'. Hay demasiados ramos o la página tiene un bug. Saltando...")
        return

    mensaje_busqueda = f"Buscando {escuela_nombre}"
    if prefijo_sigla:
        mensaje_busqueda += f" (Siglas que empiezan con '{prefijo_sigla}')"
    print(f"🚀 {mensaje_busqueda}...")
    
    estado, cursos = buscar_cursos(semestre, escuela_valor, escuela_nombre, prefijo_sigla)
    
    if estado == 'EXITO':
        print(f"   ✔️ Se encontraron {len(cursos)} cursos. Guardando...")
        guardar_cursos(cursos)
        
    elif estado == 'MUCHOS_RESULTADOS':
        print(f"   ⚠️ Límite de 500 superado. Activando PLAN B: Dividiendo búsqueda...")
        # Iterar por todo el abecedario (A-Z) y también por números (0-9)
        # Esto es vital porque siglas como MAT explotan, y sus siguientes caracteres son números (MAT1, MAT2...)
        caracteres = string.ascii_uppercase + string.digits
        for char in caracteres:
            nuevo_prefijo = prefijo_sigla + char
            explorar_escuela(semestre, escuela_valor, escuela_nombre, nuevo_prefijo)
            
    elif estado == 'SIN_RESULTADOS':
        print(f"   ➖ No hay resultados para esta combinación. Saltando.")
        
    elif estado == 'ERROR':
        print(f"   ❌ Error de conexión al buscar. Reintentando en 3 segundos...")
        time.sleep(3)
        explorar_escuela(semestre, escuela_valor, escuela_nombre, prefijo_sigla)

# ==========================================
# EJECUCIÓN PRINCIPAL
# ==========================================
def main():
    print("="*50)
    print("INICIANDO EXAMIO SCRAPER - ESTRATEGIA DIVIDE Y VENCERÁS")
    print("="*50)
    
    inicializar_db()
    
    todas_las_escuelas = obtener_escuelas(SEMESTRE_ACTUAL)
    
    if not todas_las_escuelas:
        print("No se pudieron cargar las escuelas. Abortando.")
        return
        
        
    print("\n" + "="*50)
    print("🚀 MODO PRODUCCIÓN: Extrayendo TODA la Universidad Católica")
    print("="*50)
    
    for escuela in todas_las_escuelas:
        explorar_escuela(SEMESTRE_ACTUAL, escuela["valor"], escuela["nombre"])
        
    print("\n🎉 ¡Proceso finalizado con éxito! Malla completa descargada.")
    print("Puedes revisar tus datos en el archivo 'examio_cursos.db' usando programas como DB Browser for SQLite.")

if __name__ == "__main__":
    main()