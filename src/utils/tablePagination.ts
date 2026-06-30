import { useState } from 'react';
import type { TablePaginationConfig } from 'antd';

export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

export function useTablePagination(defaultPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const pagination: TablePaginationConfig = {
    current: currentPage,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} 件`,
    onChange: (page, size) => {
      setCurrentPage(page);
      setPageSize(size);
    },
    onShowSizeChange: (_current, size) => {
      setCurrentPage(1);
      setPageSize(size);
    },
  };

  const resetPage = () => setCurrentPage(1);

  return { pagination, resetPage };
}
