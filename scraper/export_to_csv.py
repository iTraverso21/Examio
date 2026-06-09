import sqlite3
import csv
import os

# Nombre del archivo de base de datos
DB_PATH = 'examio_cursos.db'

def exportar_csv():
    # Verificamos si la base de datos existe en la carpeta actual
    if not os.path.exists(DB_PATH):
        print(f"❌ No se encontró la base de datos '{DB_PATH}' en esta carpeta.")
        print("Asegúrate de que 'examio_cursos.db' esté dentro de esta misma carpeta.")
        return

    # Conectarse a la base de datos
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Obtener todos los datos
    cursor.execute("SELECT * FROM cursos")
    datos = cursor.fetchall()
    
    # Obtener los nombres de las columnas
    nombres_columnas = [descripcion[0] for descripcion in cursor.description]
    
    # Escribir en CSV
    csv_filename = 'ramos_uc.csv'
    with open(csv_filename, 'w', newline='', encoding='utf-8') as archivo_csv:
        escritor = csv.writer(archivo_csv)
        escritor.writerow(nombres_columnas)  # Escribir la cabecera
        escritor.writerows(datos)            # Escribir los datos
        
    print(f"✅ ¡Éxito! Se han exportado {len(datos)} ramos al archivo '{csv_filename}'.")
    conn.close()

if __name__ == '__main__':
    exportar_csv()
