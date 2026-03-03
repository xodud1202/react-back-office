export type AdminMenuItem = {
  menuNo: number;
  upMenuNo: number;
  menuLevel: number;
  menuNm: string;
  menuUrl: string;
  sortSeq: number | null;
  useYn: string;
  childCount: number | null;
};

export type AdminMenuTreeNode = AdminMenuItem & {
  children: AdminMenuTreeNode[];
};

export type AdminMenuFormState = {
  menuNo: number;
  upMenuNo: number;
  menuLevel: number;
  menuNm: string;
  menuUrl: string;
  sortSeq: number | null;
  useYn: string;
};

export type AdminMenuContextMenuState = {
  x: number;
  y: number;
  target: AdminMenuItem;
};
