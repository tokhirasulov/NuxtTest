export interface Appeal {
  id: number
  title: string
  description: string
  children: Appeal[]
  parentId: number | null
  isFolder: boolean
}
