"""
Carga datos de prueba en Redis Cloud.
Ejecutar con: python seed.py
"""
import requests

BASE = "http://127.0.0.1:8000/paradas"

paradas = [
    {
        "nombre": "Parada Zócalo",
        "colonia": "Centro",
        "municipio": "Puebla",
        "latitud": 19.0431,
        "longitud": -98.1937,
        "rutas": ["Ruta 1", "Ruta 15", "Ruta 72"],
        "activa": True
    },
    {
        "nombre": "Parada BUAP",
        "colonia": "Los Volcanes",
        "municipio": "Puebla",
        "latitud": 19.0467,
        "longitud": -98.2065,
        "rutas": ["Ruta 4", "Ruta 61"],
        "activa": True
    },
    {
        "nombre": "Parada Angelópolis",
        "colonia": "Reserva Territorial Atlixcáyotl",
        "municipio": "Puebla",
        "latitud": 18.9986,
        "longitud": -98.2371,
        "rutas": ["Ruta 52", "Ruta 88"],
        "activa": True
    },
    {
        "nombre": "Parada Paseo Bravo",
        "colonia": "Barrio de Santiago",
        "municipio": "Puebla",
        "latitud": 19.0405,
        "longitud": -98.1980,
        "rutas": ["Ruta 3", "Ruta 10"],
        "activa": True
    },
    {
        "nombre": "Parada Central de Autobuses",
        "colonia": "El Carmen",
        "municipio": "Puebla",
        "latitud": 19.0309,
        "longitud": -98.2020,
        "rutas": ["Ruta 2", "Ruta 20", "Ruta 44"],
        "activa": True
    },
    {
        "nombre": "Parada Plaza Dorada",
        "colonia": "El Vergel",
        "municipio": "Puebla",
        "latitud": 19.0290,
        "longitud": -98.1873,
        "rutas": ["Ruta 7", "Ruta 33"],
        "activa": False
    },
]

print("Cargando paradas de prueba...\n")
ok = 0
for p in paradas:
    r = requests.post(BASE, json=p)
    if r.status_code in (200, 201):
        data = r.json()
        print(f"  ✅ {p['nombre']} → ID: {data.get('id')}")
        ok += 1
    else:
        print(f"  ❌ {p['nombre']} → {r.status_code}: {r.text}")

print(f"\n{ok}/{len(paradas)} paradas creadas correctamente.")
