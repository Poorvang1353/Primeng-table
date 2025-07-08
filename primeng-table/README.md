# PrimeNG Table Library

A powerful, feature-rich table component built on top of PrimeNG that provides advanced functionality for displaying, filtering, sorting, and managing tabular data.

## Features

### Core Table Features

- **Pagination**: Client-side and server-side pagination support
- **Sorting**: Multi-column sorting with customizable sort order
- **Searching**: Global search and advanced filtering
- **Column Selection**: Allow users to show/hide columns
- **Row Selection**: Single, multiple, and checkbox-based row selection
- **Reorderable Rows**: Drag-and-drop row reordering
- **Sticky Headers**: Keep headers visible while scrolling
- **Virtual Scrolling**: Efficiently render large datasets
- **Export**: Export table data to PDF and Excel formats
- **Responsive Design**: Adapts to different screen sizes
- **RTL Support**: Right-to-left language support (Arabic, etc.)
- **Internationalization**: Multi-language support via ngx-translate

### Advanced Search

The library includes a powerful advanced search component that supports:

- **Multiple Filter Types**:
  - Text filters (contains, equals, starts with, etc.)
  - Date range filters
  - Numeric range filters
  - Dropdown selection filters
  - Min/Max value filters
  - Price range filters
  
- **Filter Persistence**: Filters are automatically saved to session storage
- **Filter Combinations**: Combine multiple filters with AND/OR logic
- **Filter UI**: User-friendly interface for building complex queries

### Status Display

Easily display status indicators with customizable styling:

- **Dynamic Status Configuration**: Map status values to CSS classes
- **Automatic Status Detection**: Automatically detect status columns by name or explicit marking
- **Translation Support**: Status labels can be translated via ngx-translate

## Installation

```bash
npm install primeng-table --save
```

### Dependencies

This library requires:

- Angular 12+
- PrimeNG 12+
- ngx-translate (for translation support)
- PrimeIcons

## Basic Usage

Import the module in your app:

```typescript
import { PrimengTableModule } from 'primeng-table';

@NgModule({
  imports: [
    PrimengTableModule,
    // other imports
  ]
})
export class AppModule { }
```

Use the component in your template:

```html
<lib-p-table
  [cols]="columns"
  [products]="data"
  [pagination]="true"
  [searchBox]="true"
  [tableId]="'my-table'"
  (onFilterChange)="handleFilterChange($event)"
  (selectedProductsChange)="handleSelectionChange($event)">
</lib-p-table>
```

## API Reference

### Inputs

| Input                      | Type                | Default              | Description |
|----------------------------|---------------------|----------------------|-------------|
| `pagination`               | boolean             | -                    | Enables pagination |
| `reorderableRow`         | boolean             | -                    | Enables row reordering |
| `sortedColumn`             | Column              | `{ field: '', header: '' }` | Currently sorted column |
| `first1`                   | number              | 0                    | Starting row index |
| `selectedColumns`          | any[]               | []                   | Currently visible columns |
| `dataKey`                  | string              | -                    | Unique identifier for rows |
| `sortColumn`               | boolean             | true                 | Enables column sorting |
| `searchBox`                | boolean             | true                 | Shows global search box |
| `searchLabel`              | string              | -                    | Custom label for search box |
| `showColumnSelection`      | boolean             | false                | Enables column selection dropdown |
| `extraSerarchDropDown`     | boolean             | false                | Shows extra search dropdown |
| `extraSerarchDropDownList` | any                 | -                    | Items for extra search dropdown |
| `exportFunction`           | boolean             | true                 | Shows export buttons |
| `summary`                  | boolean             | false                | Shows summary row |
| `products`                 | any[]               | -                    | Data to display |
| `cols`                     | any[]               | -                    | Column definitions |
| `clientSidePaginationAndSearch` | boolean       | false                | Use client-side pagination/search |
| `sortOrder`                | any                 | 0                    | Default sort order |
| `sortField`                | any                 | 'lastmodifieddate'   | Default sort field |
| `totalRecordss`            | number              | -                    | Total number of records |
| `rowsPerPage`              | any                 | -                    | Rows per page |
| `rowsPerPageOptions`       | number[]            | [5, 10, 15, 20, 50]  | Available page size options |
| `scrollable`               | boolean             | false                | Makes table scrollable |
| `scrollHeight`             | string              | -                    | Height of scrollable area |
| `virtualScroll`            | boolean             | false                | Enables virtual scrolling |
| `virtualScrollItemSize`    | string              | -                    | Item size for virtual scroll |
| `isEnableStickyHeader`     | boolean             | -                    | Enables sticky header |
| `isLazyLoadIsOn`           | boolean             | false                | Enables lazy loading |
| `language`                 | string              | 'en'                 | Current language |
| `tableId`                  | string              | -                    | Unique identifier for table |
| `selectedProducts`         | any[] \| null       | -                    | Selected rows |
| `advanceSearchColumns`     | any[]               | []                   | Columns for advanced search |
| `isAdvanced`               | boolean             | -                    | Enables advanced search |
| `disableStickyHeader`      | boolean             | -                    | Disables sticky header |
| `statusConfigs`            | StatusConfigMap     | -                    | Status configuration map |
| `reorderableColumns`       | boolean             | false                | Enables reorder Columns |

### Outputs

| Output                  | Type                                      | Description |
|-------------------------|-------------------------------------------|-------------|
| `onSortChange`          | EventEmitter<any>                         | Emitted when sort changes |
| `onSearchDropDownChange`| EventEmitter<any>                         | Emitted when search dropdown changes |
| `onRowReorderCallback`  | EventEmitter<any>                         | Emitted when rows are reordered |
| `editCallback`          | EventEmitter<any>                         | Emitted when edit action is triggered |
| `deleteCallback`        | EventEmitter<any>                         | Emitted when delete action is triggered |
| `onFilterChange`        | EventEmitter<{filters: any; paginationData: any}> | Emitted when filters change |
| `selectedProductsChange`| EventEmitter<any[]>                       | Emitted when selection changes |

## Column Configuration

Columns can be configured with various options:

```typescript
const columns = [
  { 
    field: 'name',      // Data field name
    header: 'Name',     // Column header text
    sort: true,         // Enable sorting
    frozen: false,      // Pin column
    style: { width: '150px' }, // Column style
    class: 'custom-column', // Custom CSS class
    isStatus: false,    // Mark as status column
    editACl: true,      // Boolean flag or permission check function that controls edit button visibility
    deleteACL: true     // Boolean flag or permission check function that controls delete button visibility
  },
  // More columns...
];
```

### Action Column Permissions (ACL)

For action columns that contain edit and delete buttons, you can control their visibility using the `editACl` and `deleteACL` properties:

```typescript
const columns = [
  {
    field: 'actionCol',
    header: 'Actions',
    // Simple boolean approach
    editACl: true,  // Show edit button
    deleteACL: false // Hide delete button
  }
];

// OR using permission functions from your authentication service
const columns = [
  {
    field: 'actionCol',
    header: 'Actions',
    // Dynamic permission checks
    editACl: this.authService.hasPermission('EDIT_USERS'),
    deleteACL: this.authService.hasPermission('DELETE_USERS')
  }
];
```

## Status Configuration

The library provides a flexible way to handle status fields in your tables. Instead of hardcoding status values and styles, you can pass them from your parent application.

### Using Status Configurations

1. Import the required interfaces:

```typescript
import { StatusConfigMap } from 'primeng-table';
```

2. Define your status configurations:

```typescript
const myStatusConfigs: StatusConfigMap = {
  'ACTIVE': 'active-status',
  'INACTIVE': 'inactive-status',
  'IN_PROGRESS': 'in-progress-status',
  'COMPLETED': 'completed-status'
  // Add more statuses as needed
};
```

3. Pass the configurations to the p-table component:

```html
<lib-p-table
  [statusConfigs]="myStatusConfigs"
  [cols]="columns"
  [products]="data"
  ...other props
></lib-p-table>
```

4. Mark columns as status columns (optional):

```typescript
const columns = [
  { field: 'name', header: 'Name' },
  { field: 'state', header: 'State', isStatus: true }, // Will be treated as a status column
  { field: 'category', header: 'Category' }
];
```

The component will automatically apply the appropriate styling and display text for status fields. It works in two ways:
- Fields with names containing "status" (case-insensitive)
- Fields explicitly marked with `isStatus: true`

## Advanced Search Configuration

Configure advanced search with column definitions:

```typescript
const advanceSearchColumns = [
  {
    displayName: 'Status',
    keyName: 'status',
    filterType: 'isDropDown',
    dropDownItems: [
      { text: 'Active', value: 'ACTIVE' },
      { text: 'Inactive', value: 'INACTIVE' }
    ]
  },
  {
    displayName: 'Created Date',
    keyName: 'createdDate',
    filterType: 'isDateFilter'
  },
  {
    displayName: 'Price',
    keyName: 'price',
    filterType: 'isPriceRange'
  }
];
```

## Styling

The library includes default styling but can be customized by overriding CSS classes:

```css
/* Example custom styling */
:host ::ng-deep .active-status {
  background-color: #4caf50;
  color: white;
}

:host ::ng-deep .inactive-status {
  background-color: #f44336;
  color: white;
}
```

## Building

To build the library, run:

```bash
ng build primeng-table
```

This command will compile your project, and the build artifacts will be placed in the `dist/` directory.

### Publishing the Library

Once the project is built, you can publish your library by following these steps:

1. Navigate to the `dist` directory:
   ```bash
   cd dist/primeng-table
   ```

2. Run the `npm publish` command to publish your library to the npm registry:
   ```bash
   npm publish
   ```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
