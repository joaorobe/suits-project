export type InventoryItem = {
  id: string;
  title: string;
  subtitle: string;
  sku: string;
  status: "Disponível" | "Costureira" | "Alugado" | "Lavanderia";
  size: number;
  color: string;
  location: string;
  stock: number;
  image: string;
  action: string;
  priceCategory?: string;
  price?: number;
};

export type TailorOrder = {
  id: string;
  inventoryId: string;
  assignedTo: string;
  adjustmentType: string;
  description: string;
  measurements?: string;
  status: "Novo" | "Iniciado" | "Finalizado" | "Observação";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type PaymentRecord = {
  id: string;
  itemId: string;
  itemTitle: string;
  plan: "Diário" | "Semanal";
  paymentType?: "Aluguel" | "Multa";
  amount: number;
  entryAmount?: number;
  paidAmount?: number;
  status: "Pendente" | "Pago";
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  createdAt: string;
};

export type TailorTask = {
  id: string;
  orderId: string;
  title: string;
  note: string;
  assignedTo: string;
  when: string;
  status: "Aguardando" | "Em execução" | "Finalizado";
  priority: "Baixa" | "Normal" | "Alta";
};

export type ReturnOrder = {
  order: string;
  client: string;
  itemId: string;
  item: string;
  dueDate: string;
  returnedDate?: string;
  status: "Aguardando" | "Atrasado" | "Devolvido";
  penalty: string;
  action: string;
  amountPaid?: number;
  damageFee?: number;
  laundryStatus?: "Pendente" | "Em lavanderia" | "Concluído";
};

export type DashboardMetric = {
  label: string;
  value: string | number;
  detail?: string;
};

export type DashboardActivity = {
  title: string;
  description: string;
  time: string;
  badge: string;
};

export type DashboardOverview = {
  title: string;
  value: string;
  change: string;
  color: string;
};

export type User = {
  id: string;
  cpf: string;
  password: string;
  name: string;
  role: "admin" | "costureira";
};

export type LoginRequest = {
  cpf: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  user?: Pick<User, "id" | "name" | "role">;
};
