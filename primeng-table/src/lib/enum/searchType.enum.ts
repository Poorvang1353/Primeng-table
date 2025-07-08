export enum SearchDataTypeEnum {
  STRING = 'string',
  DATE = 'date',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export enum SearchControlTypeEnum {
  TEXT = 'text',
  DATE = 'date',
  NUMBER = 'number',
  RADIO = 'radio',
  SELECT = 'select',
}

export enum SearchBooleanTypeEnum {
  YES = 'Y',
  NO = 'N',
  ZERO = '0',
  ONE = '1',
  TRUE = 'true',
  FALSE = 'false',
  ACTIVE = 'A',
  INACTIVE = 'I',
}

export enum SearchFilterTypeLabelEnum {
  IS_EQUAL_TO = 'Equal To',
  IS_NOT_EQUAL_TO = 'Not Equal',
  GREATER_OR_EQUAL = 'Greater Than Equal To',
  GREATER_THAN = 'Greater Than',
  LESS_OR_EQUAL = 'Less Than Equal To',
  LESS_THAN = 'Less Than',
  CONTAINS = 'Contains',
  // NOT_CONTAINS = 'Not Contains',
  STARTS_WITH = 'Starts With',
  BETWEEN = 'Between',
  // LIKE = 'Like',
  // ENDS_WITH = 'Ends With',
  IS_NULL = 'Null',
  IS_NOT_NULL = 'Not Null',
}

export enum SearchFilterTypeValueEnum {
  IS_EQUAL_TO = 'equalto',
  IS_NOT_EQUAL_TO = 'notequal',
  GREATER_OR_EQUAL = 'greaterthaneq',
  GREATER_THAN = 'greaterthan',
  LESS_OR_EQUAL = 'lessthaneq',
  LESS_THAN = 'lessthan',
  IS_NULL = 'null',
  IS_NOT_NULL = 'notnull',
  CONTAINS = 'contains',
  // NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  BETWEEN = 'between',
  AND = 'and',
  OR = 'or',
  // ENDS_WITH = 'endsWith',
  // LIKE = 'like',
}

export enum SearchFilterConditionEnum {
  AND = 'and',
  IS = 'is',
  OR = 'or',
  IS_EQUAL_TO = 'equalto',
  IS_NOT_EQUAL_TO = 'notequal',
  GREATER_OR_EQUAL = 'greaterthaneq',
  GREATER_THAN = 'greaterthan',
  LESS_OR_EQUAL = 'lessthaneq',
  LESS_THAN = 'lessthan',
  IS_NULL = 'null',
  IS_NOT_NULL = 'notnull',
  CONTAINS = 'contains',
  // NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  BETWEEN = 'between',
}
