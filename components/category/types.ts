export type CategoryItem = {
  categoryId: string;
  parentCategoryId: string | null;
  categoryLevel: number | null;
  categoryNm: string;
  dispOrd: number | null;
  showYn: string;
  childCount?: number | null;
};

export type CategoryTreeNode = CategoryItem & {
  children: CategoryTreeNode[];
};

export type CategoryFormState = {
  categoryId: string;
  parentCategoryId: string | null;
  categoryLevel: number | null;
  categoryNm: string;
  dispOrd: number | null;
  showYn: string;
};

export type CategoryContextMenuState = {
  x: number;
  y: number;
  target: CategoryItem;
};
