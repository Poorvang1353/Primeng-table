import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { Subject } from 'rxjs';
import { SearchDataTypeEnum, SearchFilterConditionEnum, SearchFilterTypeValueEnum } from '../enum/searchType.enum';
import { SearchData } from '../enum/search-data';
import { PaginationData } from '../enum/pagination-data';
import { TranslateService } from '@ngx-translate/core';
import { StatusConfigMap } from '../enum/status-config';

interface Column {
  field: string;
  header: string;
  [key: string]: any; // optional: to allow other dynamic props
}

export enum PTableStaticStrings {
  LastModifiedDate = 'lastmodifieddate',
  Any = 'any',
  AdvanceSearch = 'advanceSearch',
  GlobalSearch = 'globalSearch',
  Pagination = 'pagination',
  SelectedColumns = 'selectedColumns',
  TableId = 'tableId',
}

@Component({
  selector: 'lib-p-table',
  standalone: false,
  templateUrl: './p-table.component.html',
  styleUrl: './p-table.component.css'
})
export class PTableComponent implements OnInit {
  @Input() pagination: boolean;
  @Input() reorderableRow: boolean;
  @Input() sortedColumn: Column = { field: '', header: '' };
  @Input() first1 = 0;
  @Input() selectedColumns: any[] = [];
  @Input() dataKey: string;
  @Input() sortColumn = true;
  @Input() searchBox = true;
  @Input() searchLabel: string;
  @Input() showColumnSelection = false;
  @Input() extraSerarchDropDown = false;
  @Input() extraSerarchDropDownList: any;
  @Input() exportFunction = false;
  @Input() summary = false;
  @Input() products: any[];
  @Input() cols: any[];
  @Input() clientSidePaginationAndSearch = false;
  @Input() sortOrder: any = 0;
  @Input() sortField: any = PTableStaticStrings.LastModifiedDate;
  @Input() totalRecordss: number;
  @Input() rowsPerPage: any;
  @Input() rowsPerPageOptions: [5, 10, 15, 20, 50];
  @Input() scrollable = false;
  @Input() scrollHeight: string;
  @Input() virtualScroll = false;
  @Input() virtualScrollItemSize: string;
  @Input() isEnableStickyHeader: boolean;
  @Input() isLazyLoadIsOn = false;
  @Input() language: string = 'en';
  @Input() tableId: string;
  @Input() selectedProducts!: any[] | null;
  @Input() advanceSearchColumns = [];
  @Input() isAdvanced: boolean;
  @Input() disableStickyHeader: boolean;
  @Input() statusEnum: any; // For backward compatibility
  @Input() statusConfigs: StatusConfigMap; // New generic way to handle statuses
  @Input() storeInSessionStorage = false;
  @Input() reorderableColumns = false;

  @Output() onSortChange = new EventEmitter<any>();
  @Output() onSearchDropDownChange = new EventEmitter<any>();
  @Output() onRowReorderCallback = new EventEmitter<any>();
  @Output() editCallback = new EventEmitter<any>();
  @Output() deleteCallback = new EventEmitter<any>();
  @Output() onFilterChange = new EventEmitter<{ filters: any; paginationData: any }>();
  @Output() selectedProductsChange = new EventEmitter<any[]>();

  @ViewChild('tableGrid') tableGrid: Table;

  // Public method to access the tableGrid
  public getTableGrid(): Table {
    return this.tableGrid;
  }

  // Public properties
  tableConfig: any[] = [];
  tableconfigObject: any = {
    advanceSearchArray: [],
    globalSearch: '',
    pagination: [],
    tableId: ''
  };
  sortDirection: number = 1;
  selectedAdvanceFilter: any;
  globalFilterValue = '';
  tableData: any;
  first: number;
  selectedSearchColumn: any;
  paginationData: { rowsPerPage: any; pageNumber: number };
  public storedArray: any[] = [];
  tableStyleDiv = 'p-datatable-sm tableWrap stickyTableHeader';
  private searchTerms = new Subject<any>();
  isApiCallDoneFromINIT: boolean = true;
  previousOrderData = {
    column: 'lastmodifieddate',
    descending: null,
  };
  isTabSwitchDone: any = false;
  previousFirst: any = 0;


  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public translate: TranslateService
  ) {}

  ngOnInit() {
    // Always initialize selectedColumns from cols
    this.cols = this.cols.filter(col => {
      if(col.field == 'actionCol'){
        if ((col?.editACl == undefined || col?.editACl) || (col?.deleteACL == undefined || col?.deleteACL)){
          return true
        }
        else 
        return false
      }
      else 
      return true
    })
    this.selectedColumns = this.cols;
    if(this.storeInSessionStorage){
      if(this.isLazyLoadIsOn){
        this.removeGlobalSearchFromSessionStorage()
      }
      this.setSearchPaginationInNgmodelFromSessionStorage();
    }
    // Set table style class based on sticky header
    this.tableStyleDiv = this.isEnableStickyHeader
      ? 'p-datatable-sm tableWrap stickyTableHeader'
      : 'p-datatable-sm tableWrap';
    this.setPipeForSearch();
    if (this.extraSerarchDropDownList && this.extraSerarchDropDown) {
      this.selectedSearchColumn = this.extraSerarchDropDownList[0].textEn;
    }
  }

  removeGlobalSearchFromSessionStorage(){
    let tableConfig: any = JSON.parse(sessionStorage.getItem('tableConfig'))
    if(tableConfig){
      tableConfig.forEach((ls) => {
        if(ls.tableId == this.tableId){
          ls.globalSearch = ''
          this.paginationData = new PaginationData(this.rowsPerPage, 1)
          ls.pagination = [{ pageNumber: this.paginationData.pageNumber, rowsPerPage: this.paginationData.rowsPerPage }]
        }
      });
      sessionStorage.removeItem('tableConfig')
      sessionStorage.setItem('tableConfig', JSON.stringify(tableConfig))
    }
  }  

  containsStatus(field: string): boolean {
    // Check if the column is explicitly marked as status
    const column = this.cols.find(col => col.field === field);
    if (column && column.isStatus) {
      return true;
    }
    return false;
  }
  onColumnSelectionChange(event: any): void {
    this.selectedColumns = this.cols.filter(col => event.value.some(selected => selected.field === col.field));
    const columnFields = event.value.map(col => col.field);
    if(this.storeInSessionStorage){
      this.setTableConfigInSessionStorage(this.tableId, columnFields, PTableStaticStrings.SelectedColumns)
    }
  }

  handleRowReorder(event: any) {
    // Emit row reorder event to parent
    this.onRowReorderCallback.emit(event);
  }
  setPipeForSearch() {
    // Subscribe to search terms and emit filter changes
    this.searchTerms.subscribe(data => {
      this.onFilterChange.emit(data);
    });
  }
  setSearchPaginationInNgmodelFromSessionStorage() {
    // Restore table config from session storage
    let tableConfig: any = JSON.parse(sessionStorage.getItem('tableConfig'));
    if (!tableConfig) sessionStorage.setItem('tableConfig', JSON.stringify(this.tableConfig));
    if (tableConfig && tableConfig.length > 0) {
      tableConfig.forEach((res: any) => {
        if (res.tableId === this.tableId) {
          this.selectedAdvanceFilter = res.advanceSearchArray;
          this.globalFilterValue = res.globalSearch;
          this.selectedColumns = res.selectedColumns;
          if (res.pagination && res.pagination.length > 0 && res.pagination[0].pageNumber)
            this.first1 = (res.pagination[0].pageNumber - 1) * res.pagination[0].rowsPerPage;
          this.rowsPerPage = res.pagination[0].rowsPerPage;
        }
      });
    }
  }
  onSelection(event: any) {
    // Emit selected products change
    this.selectedProductsChange.emit(this.selectedProducts);
  }
  /**
   * Handles both search input (string) and pagination (object) events.
   * - For search: emits filter change if input is empty or >2 chars.
   * - For pagination: emits filter change with new pagination data.
   */
  onSearchBoxChange(event: any, tableId: string) {
    // Handle search string
    if (event && typeof event === 'string') {
      const trimmed = event.trim();
      // Only trigger search if input is empty or >2 chars
      if (trimmed.length === 0 || trimmed.length > 2) {
        if(this.storeInSessionStorage){
          this.setTableConfigInSessionStorage(tableId, trimmed, PTableStaticStrings.GlobalSearch);
        }
        this.storedArray = this.storedArray.filter(ls => ls.filterColumn !== PTableStaticStrings.Any);
        if (trimmed === '') {
          this.searchTerms.next({ filters: this.storedArray, paginationData: undefined });
        } else {
          const filter = this.createGlobalSearchFilter(trimmed);
          this.storedArray.push(filter);
          this.searchTerms.next({ filters: this.storedArray, paginationData: undefined });
        }
        this.tableGrid._first = 0;
        this.previousFirst = 0;
      }
    }

    // Handle pagination event
    if (typeof event === 'object') {
      if(this.storeInSessionStorage){
        this.setTableConfigInSessionStorage(tableId, event, PTableStaticStrings.Pagination);
      }
      if (!this.clientSidePaginationAndSearch) {
        this.rowsPerPage = event.rows;
        const pagination = {
          rowsPerPage: event.rows,
          pageNumber: event.first / event.rows + 1,
        };
        this.onFilterChange.emit({ filters: this.storedArray, paginationData: pagination });
      }
    }
  }

  /**
   * Helper to create a global search filter object.
   */
  private createGlobalSearchFilter(value: string) {
    return {
      filterColumn: PTableStaticStrings.Any,
      filterOperator: SearchFilterTypeValueEnum.IS_EQUAL_TO,
      filterCondition: SearchFilterConditionEnum.AND,
      filterValue: value,
      filterDataType: SearchDataTypeEnum.STRING,
    };
  }
  /**
   * Applies advanced search filters and updates local storage.
   * Emits filter changes with the correct pagination data.
   */
  applyAdvanceFilter(advanceSearchArray: any, tableId: string) {
    if(this.storeInSessionStorage){
      this.setTableConfigInSessionStorage(tableId, advanceSearchArray, PTableStaticStrings.AdvanceSearch);
    }

    // If no filters, emit with only 'any' filters and reset table
    if (!advanceSearchArray) {
      this.storedArray = this.storedArray.filter(ls => ls.filterColumn === PTableStaticStrings.Any);
      this.emitFilterChange(this.storedArray);
      this.tableGrid._first = 0;
      this.previousFirst = 0;
      return;
    }

    // If filters exist, merge and deduplicate
    this.storedArray = this.storedArray.filter(ls => ls.filterColumn === PTableStaticStrings.Any);
    this.storedArray.push(...advanceSearchArray);
    this.storedArray = this.removeDuplicatesColumnFromAdvancedArray(this.storedArray);
    this.emitFilterChange(this.storedArray);
    this.tableGrid._first = 0;
    this.previousFirst = 0;
  }

  /**
   * Helper to emit filter changes with current pagination settings.
   */
  private emitFilterChange(filters: any[]) {
    this.onFilterChange.emit({
      filters,
      paginationData: {
        rowsPerPage: this.rowsPerPage,
        pageNumber: undefined,
      },
    });
  }
  loadDataLazy(event: any) {
    setTimeout(() => {
      // Early return conditions - check all prevention cases first
      
      // Case 1: Skip if this is the initial call from ngOnInit
      if (this.isApiCallDoneFromINIT) {
        this.isApiCallDoneFromINIT = false;
        return;
      }
  
      // Case 2: Skip if sorting has changed (sorting is handled separately)
      const newOrderData = {
        column: event.sortField || null, 
        descending: event.sortOrder || null, 
      };
      
      if (this.isSortingChanged(newOrderData)) {
        return;
      }
      
      // Case 3: Skip if tab switch triggered this call
      if (this.isTabSwitchDone) {
        this.isTabSwitchDone = false;
        return;
      }
  
      // Case 4: Skip if user is scrolling up (prevent duplicate loading)
      if (this.previousFirst > event.first) {
        return;
      }
  
      // Case 5: Skip if no products data available
      if (!this.products || this.products.length === 0) {
        return;
      }
  
      // Case 6: Skip if we've reached the end of available data
      if (this.products?.length && this.products.length % this.rowsPerPage !== 0) {
        return;
      }
  
      // All prevention checks passed, proceed with data loading
      this.loadNextPage(event);
    }, 900);
  }

  /**
   * Checks if sorting parameters have changed
   */
  private isSortingChanged(newOrderData: {column: string | null, descending: number | null}): boolean {
    const isOrderDataDifferent = 
      newOrderData.column !== this.previousOrderData.column || 
      newOrderData.descending !== this.previousOrderData.descending;
    
    if (isOrderDataDifferent) {
      this.previousOrderData = newOrderData;
      return true;
    }
    return false;
  }

  /**
   * Loads the next page of data after all prevention checks pass
   */
  private loadNextPage(event: any): void {
    // Update pagination info for session storage
    const paginationInfo = {
      first: this.products?.length,
      rows: this.rowsPerPage
    };
    
    if (this.storeInSessionStorage) {
      this.setTableConfigInSessionStorage(this.tableId, paginationInfo, 'pagination');
    }

    // Calculate pagination for the next page
    const pagination: any = {
      rowsPerPage: this.rowsPerPage,
      pageNumber: this.products?.length / ((event.rows == 0) ? 10 : event.rows) + 1,
    };
    
    // Emit filter change to load next page
    this.onFilterChange.emit({ 
      filters: this.storedArray, 
      paginationData: pagination 
    });
    
    // Update tracking variables
    this.previousFirst = event.first;
    this.previousOrderData = {
      column: event.sortField || null,
      descending: event.sortOrder || null
    };
  }
  editProduct(product: any, index: number) {
    // Emit edit event and open dialog
    product['index'] = index;
    this.editCallback.emit(product);
  }
  getRowClass(rowData: any): { [key: string]: boolean } {
    // Return row class object based on language and tableId
    const classes = {
      'text-align-right': this.language === 'ar',
      'text-align-left': this.language !== 'ar',
      'dark-row': false,
      'yellow-row': false,
      'blue-row': false,
      'grey-row': false,
      'light-blue-row': false,
    };
    return classes;
  }
  getDisableCheckBox(rowData: any): boolean {
    // Disable checkbox for certain statuses and tableIds
    return false;
  }
  deleteProduct(product: any, index: number) {
    // Emit delete event and show confirmation dialog
    product['index'] = index;
    this.deleteCallback.emit(product);
    this.confirmationService.confirm({
      message: this.translate.instant('Are you sure you want to delete?'),
      header: this.translate.instant('Confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('Successful'),
          detail: this.translate.instant('Product Deleted'),
          life: 3000,
        });
      },
    });
  }
  onHeaderClick(column: any) {
    // Handle column sorting logic
    if (column.sort) {
      if (this.sortedColumn.field === column.field) {
        this.sortDirection = 0;
        this.sortedColumn = { field: '', header: '' };
      } else {
        this.sortedColumn = column;
        this.sortDirection = 1;
      }
      let orderingData: any = {
        column: column.field,
        descending: this.sortDirection,
      };
      
      if (this.isLazyLoadIsOn) {
        const paginationInfo = {
          first: 0,
          rows: this.rowsPerPage,
        };
        if(this.storeInSessionStorage){
          this.setTableConfigInSessionStorage(this.tableId, paginationInfo, PTableStaticStrings.Pagination);
        }
        this.onSortChange.emit({ orderingData: orderingData, paginationData: new PaginationData() });
        this.previousFirst = 0;
      } else {
        this.onSortChange.emit({ orderingData: orderingData, paginationData: this.paginationData });
      }
    }
  }
  onFilterApply() {
    // Adjust sticky header position after filter apply
    if (!this.isLazyLoadIsOn) {
      let searchSec = this.tableGrid.el.nativeElement.querySelector('.p-datatable-header');
      let tableHeader = this.tableGrid.el.nativeElement.querySelector('.p-datatable-thead');
      setTimeout(() => {
        Object.assign(tableHeader.style, {
          top: `${searchSec.getBoundingClientRect().height}px`,
        });
      }, 1);
    }
  }
  onFilterRemove() {
    // Adjust sticky header position after filter remove
    if (!this.isLazyLoadIsOn) {
      let searchSec = this.tableGrid.el.nativeElement.querySelector('.p-datatable-header');
      let tableHeader = this.tableGrid.el.nativeElement.querySelector('.p-datatable-thead');
      setTimeout(() => {
        Object.assign(tableHeader.style, {
          top: `${searchSec.getBoundingClientRect().height}px`,
        });
      }, 1);
    }
  }
  /**
   * Stores or updates table config in session storage.
   * Handles both updating existing and creating new config objects.
   */
  setTableConfigInSessionStorage(tableId: string, event?: any, whichItem?: string) {
    let tableConfigArray: any[] = JSON.parse(sessionStorage.getItem('tableConfig')) || [];

    // If config array is empty, create and save a new config
    if (tableConfigArray.length === 0) {
      this.createAndSaveTableConfig(tableConfigArray, tableId, event, whichItem);
      return;
    }

    // Try to update existing config
    const updated = this.updateExistingTableConfig(tableConfigArray, tableId, event, whichItem);
    if (!updated) {
      // If not found, create and save a new config
      this.createAndSaveTableConfig(tableConfigArray, tableId, event, whichItem);
    }
  }

  /**
   * Helper to update an existing table config. Returns true if updated, false otherwise.
   */
  private updateExistingTableConfig(tableConfigArray: any[], tableId: string, event: any, whichItem: string): boolean {
    let updated = false;
    tableConfigArray.forEach((res) => {
      if (res.tableId === tableId) {
        updated = true;
        if (whichItem === PTableStaticStrings.AdvanceSearch) {
          res.advanceSearchArray = [];
          if (event !== undefined) res.advanceSearchArray.push(...event);
          res.pagination = [{ pageNumber: 1, rowsPerPage: this.rowsPerPage }];
        } else if (whichItem === PTableStaticStrings.GlobalSearch) {
          res.globalSearch = '';
          res.globalSearch = event;
          res.pagination = [{ pageNumber: 1, rowsPerPage: this.rowsPerPage }];
        } else if (whichItem === PTableStaticStrings.SelectedColumns) {
          res.selectedColumns = [];
          if (event !== undefined) res.selectedColumns.push(...event);
        } else {
          res.pagination = [];
          let obj = {
            pageNumber: event.first / event.rows + 1,
            rowsPerPage: event.rows,
          };
          res.pagination.push(obj);
        }
        sessionStorage.setItem('tableConfig', JSON.stringify(tableConfigArray));
      }
    });
    return updated;
  }

  /**
   * Helper to create and save a new table config.
   */
  private createAndSaveTableConfig(tableConfigArray: any[], tableId: string, event: any, whichItem: string) {
    if (whichItem === PTableStaticStrings.AdvanceSearch) {
      this.tableconfigObject.advanceSearchArray = [];
      this.tableconfigObject.advanceSearchArray.push(event);
      this.tableconfigObject.pagination = [{ pageNumber: 1, rowsPerPage: this.rowsPerPage }];
    } else if (whichItem === PTableStaticStrings.GlobalSearch) {
      this.tableconfigObject.globalSearch = '';
      this.tableconfigObject.globalSearch = event;
      this.tableconfigObject.pagination = [{ pageNumber: 1, rowsPerPage: this.rowsPerPage }];
    } else if (whichItem === PTableStaticStrings.SelectedColumns) {
      this.tableconfigObject.selectedColumns = event;
    } else {
      this.tableconfigObject.pagination = [];
      let obj = {
        pageNumber: event.first / event.rows + 1,
        rowsPerPage: event.rows,
      };
      this.tableconfigObject.pagination.push(obj);
    }
    this.tableconfigObject.tableId = tableId;
    tableConfigArray.push(this.tableconfigObject);
    sessionStorage.setItem('tableConfig', JSON.stringify(tableConfigArray));
  }
  changeSearchDropDown(event: any) {
    // Reset global filter value and emit dropdown change
    if (this.globalFilterValue !== '') {
      this.globalFilterValue = '';
      this.onSearchBoxChange(this.globalFilterValue, this.tableId);
    }
    this.onSearchDropDownChange.emit(event);
  }
  exportPdf() {
    // Export to PDF (implementation can be added as needed)
  }
  exportExcel() {
    // Export to Excel (implementation can be added as needed)
  }

  removeDuplicatesColumnFromAdvancedArray(data: any[]): any[] {
    // Remove duplicate filter columns, keeping the first occurrence
    const uniqueColumns = new Set();
    const filteredData = data.filter(item => {
      if (uniqueColumns.has(item.filterColumn)) {
        return false;
      } else {
        uniqueColumns.add(item.filterColumn);
        return true;
      }
    });
    return filteredData;
  }

  onColReorder(event: any) {
    // Handles column reordering and updates session storage
    this.setTableConfigInSessionStorage(this.tableId, event.columns, PTableStaticStrings.SelectedColumns)
    this.selectedColumns = event.columns;
  }
}