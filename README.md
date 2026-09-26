# Juntada — Control de gastos y reparto

App web (para usar desde el celular) para llevar las cuentas de un encuentro grupal: quién compró qué para
cada comida, cuánto le toca poner a cada uno y cómo quedan las cuentas con quien maneja la plata.

## Cómo funciona

- **Encuentros**: podés tener varios ("Fin de semana en familia", "Navidad"…). Se cambian desde el menú ☰.
- **Quién maneja la plata**: en cada encuentro se elige una persona. Todos arreglan cuentas solo con ella, y
  guarda el fondo común.
- **Comidas**: cada desayuno / almuerzo / merienda / cena, con menú y la lista de quiénes comieron
  (botón "Marcar a todos").
- **Compras**: cualquiera puede comprar. Se anota quién compró, cuánto gastó, qué compró y para qué comida. Los **gastos generales** (nafta, alquiler…) no son de una
  comida y se reparten en partes iguales entre todos.
- **Cobro por persona** = gasto real ÷ comensales, **redondeado hacia arriba** al múltiplo elegido en el
  encuentro ($100, $500, $1.000…), o un **precio fijo** por comida.
- **Fondo común**: lo que sobra por el redondeo. Queda para el grupo y lo guarda quien maneja la plata.
- **Cuentas**: cada uno pone lo que le toca menos lo que gastó en compras. Si la diferencia es positiva, se la
  paga a quien maneja la plata; si puso de más, se le devuelve. Al marcar un pago o una devolución se elige
  efectivo o transferencia. Si después cambian los montos, la diferencia vuelve a aparecer como pendiente.
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

Hecha con React + TypeScript + Vite.

## Publicación

La app se publica en **https://skylex157157.github.io/Gestion-157/** con GitHub Pages. El workflow
`.github/workflows/deploy.yml` la vuelve a publicar en cada push a la rama principal del repositorio.
Requiere *Settings → Pages → Source: GitHub Actions*.
