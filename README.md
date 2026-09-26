# Juntada — Control de gastos y reparto

App web (para usar desde el celular) para llevar las cuentas de un encuentro grupal donde una persona
compra todo: cuánto se gastó en cada comida, cuánto le toca poner a cada uno y quién ya le pagó.

## Cómo funciona

- **Encuentros**: podés tener varios ("Fin de semana en familia", "Navidad"…). Se cambian desde el menú ☰.
- **Quién compra todo**: en cada encuentro se elige una persona que hace todas las compras. Los demás le pagan
  a ella, y se queda con el fondo común.
- **Comidas**: cada desayuno / almuerzo / merienda / cena, con menú y la lista de quiénes comieron
  (botón "Marcar a todos").
- **Compras**: para qué comida, concepto e importe. Los **gastos generales** (nafta, alquiler…) no son de una
  comida y se reparten en partes iguales entre todos.
- **Cobro por persona** = gasto real ÷ comensales, **redondeado hacia arriba** al múltiplo elegido en el
  encuentro ($100, $500, $1.000…), o un **precio fijo** por comida.
- **Fondo común**: lo que sobra por el redondeo. Queda para el grupo y lo guarda quien compra todo.
- **Cobranza**: lo que debe cada uno. Al marcar a alguien como pagado se elige efectivo o transferencia.
  Si después cambia lo que debe, la diferencia vuelve a aparecer como pendiente.
- **Informe / PDF**: resumen completo para imprimir o guardar como PDF.

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
