import { query } from "./db";
import { DashboardActivity, DashboardMetric, DashboardOverview, InventoryItem, PaymentRecord, ReturnOrder, TailorTask, TailorOrder, User } from "./types";

function rowToInventoryItem(row: any): InventoryItem {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    sku: row.sku,
    status: row.status,
    size: row.size,
    color: row.color,
    location: row.location,
    stock: row.stock,
    image: row.image,
    action: row.action,
    priceCategory: row.price_category || undefined,
    price: row.price ? Number(row.price) : undefined,
  };
}

function rowToTailorOrder(row: any): TailorOrder {
  return {
    id: row.id,
    inventoryId: row.inventory_id,
    assignedTo: row.assigned_to,
    adjustmentType: row.adjustment_type,
    description: row.description,
    measurements: row.measurements || undefined,
    status: row.status,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || undefined,
  };
}

function rowToTailorTask(row: any): TailorTask {
  return {
    id: row.id,
    orderId: row.order_id,
    title: row.title,
    note: row.note,
    assignedTo: row.assigned_to,
    when: row.when_text,
    status: row.status,
    priority: row.priority,
  };
}

function rowToReturnOrder(row: any): ReturnOrder {
  return {
    order: row.order_id,
    client: row.client,
    itemId: row.item_id,
    item: row.item,
    dueDate: row.due_date,
    returnedDate: row.returned_date || "",
    status: row.status,
    penalty: row.penalty,
    action: row.action,
    amountPaid: row.amount_paid ? Number(row.amount_paid) : undefined,
    damageFee: row.damage_fee ? Number(row.damage_fee) : undefined,
    laundryStatus: row.laundry_status || undefined,
  };
}

function rowToPaymentRecord(row: any): PaymentRecord {
  return {
    id: row.id,
    itemId: row.item_id,
    itemTitle: row.item_title,
    plan: row.plan,
    paymentType: row.payment_type || "Aluguel",
    amount: Number(row.amount),
    entryAmount: row.entry_amount != null ? Number(row.entry_amount) : undefined,
    paidAmount: row.paid_amount != null ? Number(row.paid_amount) : undefined,
    status: row.status,
    clientName: row.client_name || undefined,
    clientPhone: row.client_phone || undefined,
    clientEmail: row.client_email || undefined,
    createdAt: row.created_at,
  };
}

function snakeCaseField(field: string) {
  const map: Record<string, string> = {
    orderId: "order_id",
    assignedTo: "assigned_to",
    returnedDate: "returned_date",
    dueDate: "due_date",
    when: "when_text",
    priceCategory: "price_category",
    amountPaid: "amount_paid",
    damageFee: "damage_fee",
    laundryStatus: "laundry_status",
    itemTitle: "item_title",
    clientName: "client_name",
    clientPhone: "client_phone",
    clientEmail: "client_email",
    entryAmount: "entry_amount",
    paidAmount: "paid_amount",
    paymentType: "payment_type",
  };
  return map[field] ?? field;
}

function buildUpdateQuery(table: string, idColumn: string, idValue: string, updates: Record<string, unknown>) {
  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return null;
  }

  const parts = keys.map((key, index) => `${snakeCaseField(key)} = $${index + 1}`);
  const values = keys.map((key) => updates[key]);
  const queryText = `UPDATE ${table} SET ${parts.join(", ")} WHERE ${idColumn} = $${keys.length + 1} RETURNING *`;
  return { queryText, values: [...values, idValue] };
}

export async function getInventory(search?: string) {
  if (!search || !search.trim()) {
    const result = await query(`SELECT * FROM inventory ORDER BY title ASC`);
    return result.rows.map(rowToInventoryItem);
  }

  const normalized = `%${search.toLowerCase()}%`;
  const result = await query(
    `SELECT * FROM inventory WHERE LOWER(title || ' ' || subtitle || ' ' || sku || ' ' || status || ' ' || color || ' ' || location) LIKE $1 ORDER BY title ASC`,
    [normalized]
  );
  return result.rows.map(rowToInventoryItem);
}

export async function getInventoryById(id: string) {
  const result = await query(`SELECT * FROM inventory WHERE id = $1`, [id]);
  return result.rows[0] ? rowToInventoryItem(result.rows[0]) : null;
}

export async function addInventory(item: InventoryItem) {
  const result = await query(
    `INSERT INTO inventory (id, title, subtitle, sku, status, size, color, location, stock, image, action, price_category, price)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [item.id, item.title, item.subtitle, item.sku, item.status, item.size, item.color, item.location, item.stock, item.image, item.action, item.priceCategory ?? null, item.price ?? null]
  );
  return rowToInventoryItem(result.rows[0]);
}

export async function updateInventory(id: string, updates: Partial<InventoryItem>) {
  const queryData = buildUpdateQuery("inventory", "id", id, updates as Record<string, unknown>);
  if (!queryData) return getInventoryById(id);
  const result = await query(queryData.queryText, queryData.values);
  return result.rows[0] ? rowToInventoryItem(result.rows[0]) : null;
}

export async function deleteInventory(id: string) {
  const result = await query(`DELETE FROM inventory WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getTailorTasks() {
  const result = await query(`SELECT * FROM tailor_tasks ORDER BY id ASC`);
  return result.rows.map(rowToTailorTask);
}

export async function updateTailorTask(id: string, status: TailorTask["status"]) {
  const result = await query(`UPDATE tailor_tasks SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
  return result.rows[0] ? rowToTailorTask(result.rows[0]) : null;
}

export async function getReturnOrders() {
  const result = await query(`SELECT * FROM return_orders ORDER BY order_id ASC`);
  return result.rows.map(rowToReturnOrder);
}

export async function createReturnOrder(order: Omit<ReturnOrder, "order">) {
  const id = `RO-${Date.now()}`;
  const result = await query(
    `INSERT INTO return_orders (order_id, client, item_id, item, due_date, status, penalty, action, amount_paid, damage_fee, laundry_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [id, order.client, order.itemId, order.item, order.dueDate, order.status, order.penalty, order.action, order.amountPaid ?? null, order.damageFee ?? null, order.laundryStatus ?? null]
  );
  return rowToReturnOrder(result.rows[0]);
}

export async function updateReturnOrder(order: string, updates: Partial<ReturnOrder>) {
  const queryData = buildUpdateQuery("return_orders", "order_id", order, updates as Record<string, unknown>);
  if (!queryData) return getReturnOrders();
  const result = await query(queryData.queryText, queryData.values);
  return result.rows[0] ? rowToReturnOrder(result.rows[0]) : null;
}

export async function getPayments() {
  const result = await query(`SELECT * FROM payments ORDER BY created_at DESC`);
  return result.rows.map(rowToPaymentRecord);
}

export async function createPayment(payment: Omit<PaymentRecord, "createdAt">) {
  const id = `PAY-${Date.now()}`;
  const result = await query(
    `INSERT INTO payments (id, item_id, item_title, plan, payment_type, amount, entry_amount, paid_amount, status, client_name, client_phone, client_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [id, payment.itemId, payment.itemTitle, payment.plan, payment.paymentType ?? "Aluguel", payment.amount, payment.entryAmount ?? null, payment.paidAmount ?? null, payment.status, payment.clientName ?? null, payment.clientPhone ?? null, payment.clientEmail ?? null]
  );
  return rowToPaymentRecord(result.rows[0]);
}

export async function updatePayment(id: string, updates: Partial<PaymentRecord>) {
  const queryData = buildUpdateQuery("payments", "id", id, updates as Record<string, unknown>);
  if (!queryData) return getPayments();
  const result = await query(queryData.queryText, queryData.values);
  return result.rows[0] ? rowToPaymentRecord(result.rows[0]) : null;
}

export async function getCostureiras() {
  const result = await query(`SELECT id, name, role FROM users WHERE role = 'costureira' ORDER BY name ASC`);
  return result.rows as Array<Pick<User, "id" | "name" | "role">>;
}

export async function getDashboardMetrics() {
  function formatCurrency(value: number) {
    return `R$ ${value.toFixed(2)}`;
  }

  function parsePossibleDate(value?: string | null) {
    if (!value) return null;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return null;
  }

  function formatRelativeTime(date: Date | null) {
    if (!date) return "Sem horário";
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "Agora";
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Há ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays} d`;
  }

  type ActivityEvent = {
    title: string;
    description: string;
    badge: string;
    date: Date | null;
  };

  const [
    inventoryCountResult,
    inventoryAvailableResult,
    inventoryLaundryResult,
    pendingReturnsResult,
    lateReturnsResult,
    returnedCountResult,
    tailorTasksCountResult,
    tailorNewTasksResult,
    activeClientsResult,
    paymentsTodayResult,
    paidTodayResult,
    paymentsSummaryResult,
    recentPaymentsResult,
    recentReturnsResult,
  ] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM inventory`),
    query(`SELECT COUNT(*)::int AS count FROM inventory WHERE status = 'Disponível'`),
    query(`SELECT COUNT(*)::int AS count FROM inventory WHERE status = 'Lavanderia'`),
    query(`SELECT COUNT(*)::int AS count FROM return_orders WHERE status = 'Aguardando'`),
    query(`SELECT COUNT(*)::int AS count FROM return_orders WHERE status = 'Atrasado'`),
    query(`SELECT COUNT(*)::int AS count FROM return_orders WHERE status = 'Devolvido'`),
    query(`SELECT COUNT(*)::int AS count FROM tailor_tasks WHERE status != 'Finalizado'`),
    query(`SELECT COUNT(*)::int AS count FROM tailor_tasks WHERE status = 'Aguardando'`),
    query(`SELECT COUNT(DISTINCT COALESCE(client_name, client_email, client_phone))::int AS count FROM payments`),
    query(`SELECT COUNT(*)::int AS count FROM payments WHERE created_at::date = CURRENT_DATE`),
    query(`SELECT COUNT(*)::int AS count FROM payments WHERE status = 'Pago' AND updated_at::date = CURRENT_DATE`),
    query(`SELECT COALESCE(SUM(paid_amount), 0)::numeric AS collected, COALESCE(SUM(amount - COALESCE(paid_amount, 0)), 0)::numeric AS open_balance FROM payments`),
    query(`SELECT id, item_title, client_name, amount, paid_amount, status, created_at, updated_at FROM payments ORDER BY GREATEST(created_at, updated_at) DESC LIMIT 20`),
    query(`SELECT order_id, item, status, laundry_status, returned_date, due_date FROM return_orders WHERE status = 'Devolvido' OR laundry_status = 'Em lavanderia' ORDER BY order_id DESC LIMIT 20`),
  ]);

  const inventoryCount = inventoryCountResult.rows[0].count;
  const inventoryAvailable = inventoryAvailableResult.rows[0].count;
  const inventoryLaundry = inventoryLaundryResult.rows[0].count;
  const pendingReturns = pendingReturnsResult.rows[0].count;
  const lateReturns = lateReturnsResult.rows[0].count;
  const returnedCount = returnedCountResult.rows[0].count;
  const tailorTasksCount = tailorTasksCountResult.rows[0].count;
  const tailorNewTasks = tailorNewTasksResult.rows[0].count;
  const activeClients = activeClientsResult.rows[0].count;
  const paymentsToday = paymentsTodayResult.rows[0].count;
  const paidToday = paidTodayResult.rows[0].count;
  const collectedTotal = Number(paymentsSummaryResult.rows[0].collected || 0);
  const openBalance = Number(paymentsSummaryResult.rows[0].open_balance || 0);

  const metrics: DashboardMetric[] = [
    { label: "Trajes no Estoque", value: inventoryCount, detail: `Disponíveis: ${inventoryAvailable}` },
    { label: "Devoluções Pendentes", value: pendingReturns, detail: `Atrasadas: ${lateReturns}` },
    { label: "Ajustes em Andamento", value: tailorTasksCount, detail: `Aguardando início: ${tailorNewTasks}` },
    { label: "Clientes Ativos", value: activeClients, detail: `Reservas hoje: ${paymentsToday}` },
  ];

  const paymentEvents: ActivityEvent[] = recentPaymentsResult.rows.flatMap((row: any) => {
    const events: ActivityEvent[] = [];
    const createdDate = new Date(row.created_at);
    const updatedDate = new Date(row.updated_at);
    const paidAmount = Number(row.paid_amount || 0);
    const totalAmount = Number(row.amount || 0);
    const remaining = Math.max(totalAmount - paidAmount, 0);

    events.push({
      title: "Reserva registrada",
      description: `${row.item_title} para ${row.client_name || "cliente"}`,
      badge: "Reserva",
      date: createdDate,
    });

    if (paidAmount > 0) {
      events.push({
        title: remaining > 0 ? "Entrada recebida" : "Pagamento concluído",
        description: `Pedido ${row.id} • Pago ${formatCurrency(paidAmount)} • Saldo ${formatCurrency(remaining)}`,
        badge: remaining > 0 ? "Entrada" : "Quitado",
        date: updatedDate,
      });
    }

    return events;
  });

  const returnEvents: ActivityEvent[] = recentReturnsResult.rows.map((row: any) => {
    const eventDate = parsePossibleDate(row.returned_date) || parsePossibleDate(row.due_date);
    if (row.laundry_status === "Em lavanderia") {
      return {
        title: "Traje enviado à lavanderia",
        description: `${row.item} (${row.order_id})`,
        badge: "Lavanderia",
        date: eventDate,
      };
    }

    return {
      title: "Traje devolvido",
      description: `${row.item} (${row.order_id})`,
      badge: "Devolução",
      date: eventDate,
    };
  });

  const activities: DashboardActivity[] = [...paymentEvents, ...returnEvents]
    .sort((a, b) => {
      const aTime = a.date?.getTime() ?? 0;
      const bTime = b.date?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, 10)
    .map((event) => ({
      title: event.title,
      description: event.description,
      time: formatRelativeTime(event.date),
      badge: event.badge,
    }));

  const overview: DashboardOverview[] = [
    {
      title: "Entradas Recebidas",
      value: formatCurrency(collectedTotal),
      change: `${paidToday} confirmação(ões) hoje`,
      color: "text-green-600",
    },
    {
      title: "Saldo em Aberto",
      value: formatCurrency(openBalance),
      change: `${pendingReturns} devolução(ões) pendentes`,
      color: openBalance > 0 ? "text-red-600" : "text-slate-700",
    },
    {
      title: "Fluxo Pós-Devolução",
      value: `${returnedCount} devolvidos / ${inventoryLaundry} lavanderia`,
      change: "Atualizado pelo estoque e devoluções",
      color: "text-slate-700",
    },
  ];

  return { metrics, activities, overview };
}

export async function authenticateUser(cpf: string, password: string) {
  const normalizedCpf = cpf.replace(/\D/g, "");
  const result = await query(
    `SELECT id, name, role FROM users WHERE regexp_replace(cpf, '\\D', '', 'g') = $1 AND password = $2`,
    [normalizedCpf, password]
  );
  if (!result.rows[0]) return null;
  return result.rows[0] as Pick<User, "id" | "name" | "role">;
}

export async function getTailorOrders(assignedTo?: string) {
  if (assignedTo) {
    const result = await query(`SELECT * FROM tailor_orders WHERE assigned_to = $1 ORDER BY created_at DESC`, [assignedTo]);
    return result.rows.map(rowToTailorOrder);
  }
  const result = await query(`SELECT * FROM tailor_orders ORDER BY created_at DESC`);
  return result.rows.map(rowToTailorOrder);
}

export async function getTailorOrderById(id: string) {
  const result = await query(`SELECT * FROM tailor_orders WHERE id = $1`, [id]);
  return result.rows[0] ? rowToTailorOrder(result.rows[0]) : null;
}

export async function createTailorOrder(order: Omit<TailorOrder, "id" | "createdAt" | "updatedAt">) {
  const id = `TAO-${Date.now()}`;
  const result = await query(
    `INSERT INTO tailor_orders (id, inventory_id, assigned_to, adjustment_type, description, measurements, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [id, order.inventoryId, order.assignedTo, order.adjustmentType, order.description, order.measurements || null, order.status, order.notes || null]
  );
  return rowToTailorOrder(result.rows[0]);
}

export async function updateTailorOrder(id: string, updates: Partial<TailorOrder>) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return getTailorOrderById(id);

  const snakeCaseMap: Record<string, string> = {
    inventoryId: "inventory_id",
    assignedTo: "assigned_to",
    adjustmentType: "adjustment_type",
    completedAt: "completed_at",
  };

  const parts = keys.map((key, index) => `${snakeCaseMap[key] || key} = $${index + 1}`);
  const values = keys.map((key) => updates[key as keyof TailorOrder]);
  const queryText = `UPDATE tailor_orders SET updated_at = CURRENT_TIMESTAMP, ${parts.join(", ")} WHERE id = $${keys.length + 1} RETURNING *`;
  
  const result = await query(queryText, [...values, id]);
  return result.rows[0] ? rowToTailorOrder(result.rows[0]) : null;
}

export async function deleteTailorOrder(id: string) {
  const result = await query(`DELETE FROM tailor_orders WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
