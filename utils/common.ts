// /utils/common.ts
import {ValueFormatterParams} from "ag-grid-community";

// Timestamp to YYYY-MM-DD HH24:MI:SS 형식으로 변경 처리
export function dateFormatter(params: ValueFormatterParams): string {
    try {
        if (params.value) {
            const date = new Date(params.value);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        return '';
    } catch (e) {
        console.error(e);
        return 'format error';
    }
}
