import { getExpenses } from "@/actions/expenses";
import ExpensesManager from "./ExpensesManager";

export default async function ExpensesPage() {
  // Por defecto cargamos el mes actual al entrar
  const res = await getExpenses(new Date());
  const initialExpenses = res.success && res.data ? res.data.expenses : [];
  const initialTotal = res.success && res.data ? res.data.totalAmount : 0;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Gestión de Gastos
        </h1>
        <p className="text-slate-500 font-medium">Llevá el control de las salidas de dinero del complejo.</p>
      </div>

      <ExpensesManager initialExpenses={initialExpenses} initialTotal={initialTotal} />
    </div>
  );
}