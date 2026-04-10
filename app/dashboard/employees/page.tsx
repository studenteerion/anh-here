"use client";

import { useState } from "react";
import EmployeeStats from "@/components/employees/EmployeeStats";
import EmployeeCreateForm from "@/components/employees/EmployeeCreateForm";
import EmployeeList from "@/components/employees/EmployeeList";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function EmployeesAdminPage() {
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const onCreated = () => {
    // refresh stats after creating a new employee
    setStatsRefreshKey((prev) => prev + 1);
    setShowCreateModal(false);
  };

  const handleTableRefreshed = () => {
    // only refresh stats when the table notifies us — avoid changing the list refresh key to prevent a loop
    setStatsRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 sm:gap-6">
        <EmployeeStats refreshKey={statsRefreshKey} />
        <EmployeeList
          onAddEmployee={() => setShowCreateModal(true)}
          onRefreshed={handleTableRefreshed}
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Chiudi popup aggiunta dipendente"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />

          <div className="relative z-10 w-full max-w-2xl rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
              <h2 className="text-lg sm:text-xl font-semibold">
                Aggiungi dipendente
              </h2>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                aria-label="Chiudi"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              <EmployeeCreateForm onCreated={onCreated} embedded />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

