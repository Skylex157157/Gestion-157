# Juntada — Control de gastos y reparto

App web (para usar desde el celular) para llevar las cuentas de un encuentro grupal: quién compró qué para
cada comida, cuánto le toca poner a cada uno y cómo quedan las cuentas con quien maneja la plata.

## Cómo funciona

- **Encuentros**: podés tener varios ("Fin de semana en familia", "Navidad"…). Se cambian desde el menú ☰.
  Cuando uno termina se puede **archivar** (sale de la lista pero se puede abrir o recuperar desde "Archivados")
  o **borrar** para siempre, desde ☰ → "Archivar o borrar encuentros".
- **Quién maneja la plata**: en cada encuentro se elige una persona. Todos arreglan cuentas solo con ella, y
  guarda el fondo común.
- **Comidas**: cada desayuno / almuerzo / merienda / cena, con menú y la lista de quiénes comieron
  (botón "Marcar a todos").
- **Compras**: cualquiera puede comprar. Se anota quién compró, cuánto gastó, qué compró y para qué comida. Los **gastos generales** (nafta, alquiler…) no son de una
  comida y se reparten en partes iguales entre todos; con el botón **Redondear** se puede redondear hacia arriba lo que pone
  cada uno, y lo que sobra va al fondo común.
- **Cobro por persona** = gasto real ÷ comensales, **redondeado hacia arriba** al múltiplo elegido en el
  encuentro ($100, $500, $1.000…), o un **precio fijo** por comida.
- **Fondo común**: lo que sobra por el redondeo. Queda para el grupo y lo guarda quien maneja la plata.
- **Cuentas**: cada uno pone lo que le toca menos lo que gastó en compras. Si la diferencia es positiva, se la
  paga a quien maneja la plata; si puso de más, se le devuelve. Al marcar un pago o una devolución se elige
  efectivo o transferencia. Si después cambian los montos, la diferencia vuelve a aparecer como pendiente.
- **Informe / PDF**: resumen completo para imprimir o guardar como PDF.

Los datos se guardan **en el teléfono** (almacenamiento del navegador), salvo los encuentros que se comparten.

### Editar en equipo

Desde ☰ → **Editar en equipo** un encuentro se sube a la nube (Cloud Firestore) y se obtiene un link. Quien lo
abre se suma al encuentro y todos ven los cambios al instante. Sin señal se sigue usando: los cambios se
guardan en el teléfono y se envían cuando vuelve la conexión (la primera vez que se abre el link hace falta
internet). Cualquiera que tenga el link puede editar; el link lleva un código largo al azar y las reglas de
`firestore.rules` no dejan listar los encuentros. Los encuentros que no se comparten siguen solo en el teléfono.

Cada persona, comida, compra y pago se guarda como un documento aparte, así dos personas que cargan cosas a la
vez no se pisan (si editan lo mismo, queda el último cambio).

Para conectarlo a un proyecto de Firebase: crear el proyecto y una base de Firestore, pegar las reglas de
`firestore.rules` en *Firestore → Reglas*, y copiar la configuración de la app web en `src/lib/nubeConfig.ts`.

Además, desde el menú podés:

- **Compartir resumen**: texto listo para pegar en WhatsApp.
- **Exportar / Importar datos**: copia de seguridad en un archivo `.json` (sirve para pasar los datos a otro teléfono).

Se puede instalar como app: en el navegador del celular, *Agregar a pantalla de inicio*.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm test         # tests de los cálculos
npm run build    # genera dist/

# probar "Editar en equipo" sin tocar la nube real (necesita Java):
npm run emulador      # emulador local de Firestore, con las reglas de firestore.rules
npm run dev:emulador  # la app conectada al emulador
```

Hecha con React + TypeScript + Vite.

## Publicación

La app se publica en **https://skylex157157.github.io/Gestion-157/** con GitHub Pages. El workflow
`.github/workflows/deploy.yml` la vuelve a publicar en cada push a la rama principal del repositorio.
Requiere *Settings → Pages → Source: GitHub Actions*.
