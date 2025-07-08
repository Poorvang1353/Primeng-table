import { SearchDataTypeEnum, SearchFilterConditionEnum, SearchFilterTypeValueEnum } from '../enum/searchType.enum';

export class SearchData {
  filterColumn: any = '';
  filterOperator?: SearchFilterTypeValueEnum;
  filterCondition?: SearchFilterConditionEnum;
  filterValue: any = '';
  filterDataType?: SearchDataTypeEnum;
}
