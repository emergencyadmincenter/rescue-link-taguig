"use client";

import { useEffect } from "react";
import { initDeviceIdentification } from "@/lib/device-identification";

export function DeviceIdentificationProvider() {
  useEffect(() => {
    initDeviceIdentification();
  }, []);

  return null;
}
