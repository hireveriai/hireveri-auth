"use client";

import { useState } from "react";
import AuthShell from "@/components/auth-shell";
import SearchableSelect from "@/components/searchable-select";

const options = Array.from({ length: 8 }, (_, i) => ({
  id: String(i),
  label: `Option ${i + 1}`,
  searchText: `Option ${i + 1}`,
}));

export default function DevSelectTest() {
  const [valueId, setValueId] = useState("");

  return (
    <AuthShell size="wide" badge="Test" title="Dropdown clipping test">
      <div className="grid grid-cols-2 gap-3">
        <SearchableSelect
          options={options}
          valueId={valueId}
          placeholder="Recruiter role"
          searchPlaceholder="Search recruiter roles"
          onChange={(o) => setValueId(o.id)}
        />
        <SearchableSelect
          options={options}
          valueId={valueId}
          placeholder="Industry"
          searchPlaceholder="Search industries"
          onChange={(o) => setValueId(o.id)}
        />
      </div>
    </AuthShell>
  );
}
