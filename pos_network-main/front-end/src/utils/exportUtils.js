import * as XLSX from "xlsx";
import { fetchDebtsList } from "./debtsService";

export const exportAllDebtsToExcel = async () => {
    try {
        const response = await fetchDebtsList();
        const allDebts = response.data; // Assuming format is { data: [...] }

        // Prepare data for export
        const exportData = allDebts.map(item => ({
            "الاسم": item.name,
            "الهاتف": item.phone,
            "العلبة": item.boxName,
            "المبلغ": item.amount,
            "مدفوع": item.paid ? "نعم" : "لا",
            "التاريخ": item.date?.split('T')[0]
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "الزبائن");

        XLSX.writeFile(wb, "customers_data.xlsx");
        return true;
    } catch (error) {
        console.error("Export failed:", error);
        throw error;
    }
};
