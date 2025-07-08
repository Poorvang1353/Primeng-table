import { CUSTOM_ELEMENTS_SCHEMA, Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PTableComponent } from './p-table/p-table.component';
import { createCustomElement } from '@angular/elements';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PaginatorModule } from 'primeng/paginator';
import { ListboxModule } from 'primeng/listbox';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { AdvanceSearchComponent } from './advance-search/advance-search.component';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { SidebarModule } from 'primeng/sidebar';
import { AccordionModule } from 'primeng/accordion';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';

@NgModule({
  declarations: [PTableComponent, AdvanceSearchComponent],
  imports: [
    CommonModule,
    TableModule,
    TranslateModule,
    FormsModule,
    ButtonModule,
    OverlayPanelModule,
    PaginatorModule,
    ListboxModule,
    CheckboxModule,
    InputTextModule,
    DialogModule,
    DropdownModule,
    MultiSelectModule,
    SidebarModule,
    AccordionModule,
    CalendarModule,
    SkeletonModule
  ],
  exports: [PTableComponent, AdvanceSearchComponent]
})
export class PrimengTableModule { 
  constructor(private injector: Injector) {}

  ngDoBootstrap() {
    const el = createCustomElement(PTableComponent, { injector: this.injector });
    customElements.define('primeng-table', el);
  }
}
