'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface FolderProps {
  selectedFolderId?: string
  onFolderSelect: (folderId: string | null) => void
  onFolderCreate?: (parentId?: string) => void
  onFolderEdit?: (folder: { id: string; name: string; parentId?: string }) => void
  onFolderDelete?: (folder: { id: string; name: string }) => void
  onItemDrop?: (itemData: any, folderId: string | null) => void
}

interface SidebarContextType {
  folderProps: FolderProps | null
  setFolderProps: (props: FolderProps | null) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [folderProps, setFolderProps] = useState<FolderProps | null>(null)

  return (
    <SidebarContext.Provider value={{ folderProps, setFolderProps }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}