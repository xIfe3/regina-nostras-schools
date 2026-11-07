import React from "react";
import { CreditCard } from "lucide-react";
import { parentAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import PaymentsView from "../../components/payments/PaymentsView";
import type { PaymentRecord } from "../../components/payments/paymentHelpers";
import { childFullName, useParentContext } from "./parentContext";

const ParentPayments: React.FC = () => {
  const { selectedChild } = useParentContext();
  const { user } = useAuth();

  if (!selectedChild) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <CreditCard className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">
            No child is linked to your account yet. Please contact the school.
          </p>
        </div>
      </div>
    );
  }

  const childId = selectedChild._id;
  const name = childFullName(selectedChild);

  return (
    <PaymentsView
      title={`Payments — ${name}`}
      subtitle={`Upload fee receipts for ${selectedChild.personalInfo.firstName} and follow their verification`}
      studentName={name}
      studentClass={selectedChild.academicInfo?.currentClass}
      viewerUserId={user?._id}
      reloadKey={childId}
      load={async (params) => {
        const res = await parentAPI.getChildPayments(childId, params);
        return {
          payments: (res.data.data as PaymentRecord[]) || [],
          totalPages: res.data.pagination?.totalPages || 1,
        };
      }}
      check={async (key) => (await parentAPI.checkChildPayment(childId, key)).data.data!}
      submit={async (data, file) => {
        await parentAPI.submitChildPayment(childId, data, file);
      }}
    />
  );
};

export default ParentPayments;
