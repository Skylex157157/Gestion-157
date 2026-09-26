# Juntada — Control de gastos y reparto

App web (para usar desde el celular) para llevar las cuentas de un encuentro grupal:
quién compró qué en cada comida, cuánto le toca poner a cada uno y quién le tiene que pagar a quién.

## Cómo funciona

- **Encuentros**: podés tener varios ("Fin de semana en familia", "Navidad"…). Se cambia desde el menú ☰.
- **Personas**: se marcan como *chico* los que comen pero no pagan; su parte se reparte entre los adultos.
- **Comidas**: cada desayuno / almuerzo / merienda / cena, con la lista de quiénes comieron
  (botón "Marcar a todos").
- **Compras**: quién compró, para qué comida, concepto e importe.
- **Cobro por persona** = gasto real ÷ adultos que comieron, **redondeado hacia arriba**
  al múltiplo elegido en el encuentro ($100, $500, $1.000…).
- **Fondo común**: lo que sobra por el redondeo. Queda para el grupo y lo guarda la persona elegida
  ("¿Quién guarda el fondo común?").
- **Cobranza**: saldos de cada uno y transferencias sugeridas (la menor cantidad de movimientos).
  Tocá ✓ cuando alguien paga y se descuenta.

Los datos se guardan **solo en el teléfono** (almacenamiento del navegador). Desde el menú podés:

- **Compartir resumen**: texto listo para pegar en WhatsApp.
- **Exportar / Importar datos**: copia de seguridad en un archivo `.json` (sirve para pasar los datos a otro teléfono).

Se puede instalar como app: en el navegador del celular, *Agregar a pantalla de inicio*.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm test         # tests de los cálculos
npm run build    # genera dist/
```

Hecha con React + TypeScript + Vite. El workflow `.github/workflows/deploy.yml` publica la app en
GitHub Pages en cada push a `main` (hay que activar *Settings → Pages → Source: GitHub Actions*).
