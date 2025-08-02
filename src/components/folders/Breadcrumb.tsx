'use client'

interface BreadcrumbItem {
  id: string | null
  name: string
}

interface BreadcrumbProps {
  selectedFolderId: string | null
  folders: Array<{ id: string; name: string; parentId?: string }>
  onFolderSelect: (folderId: string | null) => void
  className?: string
}

export function Breadcrumb({
  selectedFolderId,
  folders,
  onFolderSelect,
  className = ''
}: BreadcrumbProps) {
  // 選択されたフォルダから親フォルダまでのパスを構築
  const buildBreadcrumbPath = (): BreadcrumbItem[] => {
    if (!selectedFolderId) {
      return [{ id: null, name: 'すべてのアイテム' }]
    }

    const path: BreadcrumbItem[] = []
    let currentFolderId: string | null = selectedFolderId

    // 選択されたフォルダから親を辿る
    while (currentFolderId) {
      const folder = folders.find(f => f.id === currentFolderId)
      if (!folder) break

      path.unshift({ id: folder.id, name: folder.name })
      currentFolderId = folder.parentId || null
    }

    // 最初に「すべてのアイテム」を追加
    path.unshift({ id: null, name: 'すべてのアイテム' })

    return path
  }

  const breadcrumbPath = buildBreadcrumbPath()

  if (breadcrumbPath.length <= 1) {
    return null
  }

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 text-sm text-gray-500">
        {breadcrumbPath.map((item, index) => (
          <li key={item.id || 'root'} className="flex items-center">
            {index > 0 && (
              <svg
                className="flex-shrink-0 h-4 w-4 text-gray-300 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            
            {index === breadcrumbPath.length - 1 ? (
              // 最後のアイテム（現在のフォルダ）はリンクにしない
              <span className="font-medium text-gray-900 truncate max-w-32">
                {item.name}
              </span>
            ) : (
              // 親フォルダはクリック可能
              <button
                onClick={() => onFolderSelect(item.id)}
                className="hover:text-gray-700 truncate max-w-32 text-left"
              >
                {item.name}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}