import app from './server';
import { config } from './config/env';

app.listen(config.PORT, () => {
  console.log(`Budgeteer API running on port ${config.PORT} [${config.NODE_ENV}]`);
});
