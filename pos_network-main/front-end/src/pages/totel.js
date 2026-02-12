import React, { useEffect, useState } from "react";
import api from "../utils/api";
import "../styles/Totel.css";

export default function Totel() {
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Using existing /api/debts endpoint which returns all debts with processed data
                const res = await api.get("/debts");
                setDebts(res.data);
            } catch (err) {
                console.error("Error fetching debts:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate totals and percentages
    const paidDebts = debts.filter((d) => d.paid === true);
    const unpaidDebts = debts.filter((d) => d.paid !== true);

    const totalPaidAmount = paidDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalUnpaidAmount = unpaidDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const grandTotal = totalPaidAmount + totalUnpaidAmount;

    const paidPercentage = grandTotal > 0 ? (totalPaidAmount / grandTotal) * 100 : 0;
    const unpaidPercentage = grandTotal > 0 ? (totalUnpaidAmount / grandTotal) * 100 : 0;

    // Formatting currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Circular Progress Bar Component
    const CircularProgress = ({ percentage, color, trackColor, textColor }) => {
        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="circular-progress-container">
                <svg width="100" height="100" viewBox="0 0 100 100" className="circular-chart">
                    {/* Track Circle */}
                    <circle
                        className="circular-bg"
                        stroke={trackColor}
                        cx="50"
                        cy="50"
                        r={radius}
                        strokeWidth="8"
                        fill="none"
                    />
                    {/* Progress Circle */}
                    <circle
                        className="circle"
                        stroke={color}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        cx="50"
                        cy="50"
                        r={radius}
                        strokeWidth="8"
                        fill="none"
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                    />
                    {/* Text */}
                    <text
                        x="50"
                        y="50"
                        className="percentage-text"
                        fill={textColor || color}
                        dy=".35rem"
                        textAnchor="middle"
                        fontSize="18px"
                        fontWeight="bold"
                    >
                        {Math.round(percentage)}%
                    </text>
                </svg>
            </div>
        );
    };

    if (loading)
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>جاري التحميل...</p>
            </div>
        );

    return (
        <div className="totel-container">
            <h1 className="page-title">الإحصائيات العامة</h1>

            <div className="cards-wrapper">
                {/* Grand Total Card (Moved to Top) */}
                <div className="stat-card card-total">
                    <h2 className="card-label">المجموع الكلي</h2>
                    <CircularProgress
                        percentage={paidPercentage}
                        color="#052c22"
                        trackColor="rgba(255, 255, 255, 0.4)"
                        textColor="#052c22"
                    />
                    <p className="amount" style={{ marginTop: '20px' }}>{formatCurrency(grandTotal)}</p>
                    <p className="count">{debts.length} شخص (العدد الإجمالي)</p>
                </div>

                {/* Unpaid Card */}
                <div className="stat-card card-unpaid">
                    <h2 className="card-label">مجموع غير الدافعين</h2>
                    <CircularProgress
                        percentage={unpaidPercentage}
                        color="#ff6b6b" // Red
                        trackColor="rgba(255, 107, 107, 0.1)"
                        textColor="#ff6b6b"
                    />
                    <p className="amount">{formatCurrency(totalUnpaidAmount)}</p>
                    <p className="count">{unpaidDebts.length} شخص</p>
                </div>

                {/* Paid Card */}
                <div className="stat-card card-paid">
                    <h2 className="card-label">مجموع الدافعين</h2>
                    <CircularProgress
                        percentage={paidPercentage}
                        color="#fff"
                        trackColor="rgba(255, 255, 255, 0.3)"
                        textColor="#fff"
                    />
                    <p className="amount">{formatCurrency(totalPaidAmount)}</p>
                    <p className="count">{paidDebts.length} شخص</p>
                </div>
            </div>
        </div>
    );
}

// ----------------------------
// 🎨 Styles handled in styles/Totel.css
// ----------------------------


