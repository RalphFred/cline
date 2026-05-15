export type InventoryActionState = {
  status: "idle" | "error" | "success"
  message?: string
}

export const initialInventoryActionState: InventoryActionState = {
  status: "idle",
}
