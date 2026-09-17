"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BusinessHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/business/dashboard');
  }, []);
  return null;
}
