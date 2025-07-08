export class PaginationData {
  rowsPerPage: number;
  pageNumber: number;

  constructor(rowsPerPage: number = 10, pageNumber: number = 1) {
    this.rowsPerPage = rowsPerPage;
    this.pageNumber = pageNumber;
  }
}
