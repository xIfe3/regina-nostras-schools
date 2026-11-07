import React from "react";
import { paymentAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import PaymentsView from "../../components/payments/PaymentsView";
import type { PaymentRecord } from "../../components/payments/paymentHelpers";

const StudentPayments: React.FC = () => {
  const { user } = useAuth();
  const student = user?.student;
  const name = student
    ? [student.personalInfo?.firstName, student.personalInfo?.lastName].filter(Boolean).join(" ")
    : "you";

  return (
    <PaymentsView
      title="Payments"
      subtitle="Upload your fee receipts and follow their verification"
      studentName={name}
      studentClass={student?.academicInfo?.currentClass}
      viewerUserId={user?._id}
      load={async (params) => {
        const res = await paymentAPI.getStudentPayments(params);
        return {
          payments: (res.data.data as PaymentRecord[]) || [],
          totalPages: res.data.pagination?.totalPages || 1,
        };
      }}
      check={async (key) => (await paymentAPI.checkPayment(key)).data.data!}
      submit={async (data, file) => {
        await paymentAPI.submitPayment(data, file);
      }}
    />
  );
};

export default StudentPayments;
