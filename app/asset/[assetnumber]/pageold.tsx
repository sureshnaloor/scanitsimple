'use client';
// Add useState and useEffect for animation
import { useState, useEffect } from 'react';

import Image from "next/image";

// Types
type AssetData = {
  _id: string;
  assetnumber: string;
  acquireddate: string;
  assetdescription: string;
  acquiredvalue: number;
  assetcategory: string;
  assetsubcategory: string;
  assetstatus: string;
  assetnotes: string;
};

type CalibrationData = {
  _id: string;
  assetnumber: string;
  calibcertificate: string;
  calibfile: string;
  calibratedby: string;
  calibrationdate: string;
  calibrationfromdate: string;
  calibrationtodate: string;
  calibrationpo: string;
  createdby: string;
  createdat: string;
};

type CustodyData = {
  _id: string;
  assetnumber: string;
  custodianempno: string;
  custodianempname: string;
  department: string;
  location: string;
  racklocation: string;
  custodyfrom: string;
  createdby: string;
  createdate: string;
};

async function getAsset(assetnumber: string): Promise<AssetData> {
  // Get the base URL from environment variable or construct it
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
  const res = await fetch(`${baseUrl}/api/assets/${assetnumber}`, {
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    const errorData = await res.text();
    console.error('API Response:', {
      status: res.status,
      statusText: res.statusText,
      data: errorData,
      url: res.url
    });
    throw new Error(`Failed to fetch asset: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json();
  console.log('Fetched asset data:', data);
  return data;
}

async function getCalibrations(assetnumber: string): Promise<CalibrationData[]> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
  const res = await fetch(`${baseUrl}/api/calibrations/${assetnumber}`, {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    return []; // Return empty array if no calibrations found
  }
  
  return res.json();
}

async function getCustody(assetnumber: string): Promise<CustodyData[]> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
  const res = await fetch(`${baseUrl}/api/custody/${assetnumber}`, {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    return []; // Return empty array if no custody records found
  }
  
  return res.json();
}

export default function AssetPage({ params }: { params: { assetnumber: string } }) {
  // Add state for flash animation
  const [showFlash, setShowFlash] = useState(false);
  const [flashCount, setFlashCount] = useState(0);
  const MAX_FLASHES = 3;

   // State management
   const [calibrations, setCalibrations] = useState<CalibrationData[]>([]);
   const [asset, setAsset] = useState<AssetData | null>(null);
   const [formattedDate, setFormattedDate] = useState('');
   const [custodyRecords, setCustodyRecords] = useState<CustodyData[]>([]);

  // Effect for flash animation
  useEffect(() => {
    if (calibrations?.length > 0) {
      const isExpired = new Date(calibrations[0].calibrationtodate) < new Date();
      if (isExpired && flashCount < MAX_FLASHES) {
        setShowFlash(true);
        const timer = setTimeout(() => {
          setShowFlash(false);
          setFlashCount(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [calibrations, flashCount]);

 

  useEffect(() => {
    async function fetchData() {
      const assetData = await getAsset(params.assetnumber);
      const calibrationData = await getCalibrations(params.assetnumber);
      const custodyData = await getCustody(params.assetnumber);
      setAsset(assetData);
      setCalibrations(calibrationData);
      setCustodyRecords(custodyData);
      setFormattedDate(new Date(assetData.acquireddate).toLocaleDateString());
    }
    fetchData();
  }, [params.assetnumber]);
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(asset?.acquiredvalue || 0);

  return (
    <div className="relative flex flex-col min-h-screen text-zinc-100">
      {/* Background image - consistent with landing page */}
      <div className="fixed inset-0 z-0 bg-[conic-gradient(at_top_right,_#111111,_#1e40af,_#eeef46)] opacity-50" />
      
      {/* Content wrapper - consistent with landing page */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full">
          <div className="container mx-auto max-w-4xl flex items-center justify-between p-2">
            {/* Logo */}
            <div className="relative w-20 sm:w-40 md:w-24">
              <Image
                src="/images/logo.jpg"
                alt="JAL Logo"
                width={60}
                height={30}
                className="object-contain w-full h-auto drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
                priority
              />
            </div>
            
            {/* Asset Tags text */}
            <div className="text-sm sm:text-base md:text-lg font-semibold italic uppercase 
                          text-zinc-100 tracking-wider
                          drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]
                          transform hover:scale-105 transition-transform duration-200">
              Asset Tags
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center p-2 gap-2">
          {/* Main Asset Card */}
          <div className="bg-blue-950/20 backdrop-blur-sm rounded-lg shadow-lg p-3 w-full max-w-4xl">
            <div className="grid grid-cols-2 gap-2">
              {/* Row 1: Asset Number & Description - Bold */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                <label className="block text-xs font-medium text-teal-100">Asset Number</label>
                <div className="text-sm font-bold text-zinc-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                  {asset?.assetnumber}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                <label className="block text-xs font-medium text-teal-100">Asset Description</label>
                <div className="text-sm font-bold text-zinc-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                  {asset?.assetdescription}
                </div>
              </div>

              {/* Row 2: Acquisition Date & Value */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                <label className="block text-xs font-medium text-teal-100">Acquisition Date</label>
                <div className="text-[12px] text-zinc-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                  {formattedDate}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                <label className="block text-xs font-medium text-teal-100">Acquisition Value</label>
                <div className="text-[12px]  text-zinc-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                  {formattedValue}
                </div>
              </div>

              {/* Row 3: Category & Subcategory */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                <label className="block text-xs font-medium text-teal-100">Asset Category</label>
                <div className="text-[12px]  text-zinc-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                  {asset?.assetcategory}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                <label className="block text-xs font-medium text-teal-100">Asset Subcategory</label>
                <div className="text-[12px]  text-zinc-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                  {asset?.assetsubcategory}
                </div>
              </div>

              {/* Row 4: Status & Notes */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                <label className="block text-xs font-medium text-teal-100">Asset Status</label>
                <div className="text-[12px]  text-zinc-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                  {asset?.assetstatus}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                <label className="block text-xs font-medium text-teal-100">Asset Notes</label>
                <div className="text-[12px]  text-zinc-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                  {asset?.assetnotes}
                </div>
              </div>
            </div>
          </div>

          {/* Calibration Section - Updated background */}
          <div className="bg-sky-950/30 backdrop-blur-sm rounded-lg shadow-lg p-3 w-full max-w-4xl">
            <h2 className="text-sm font-semibold mb-2 text-blue-200">Calibration Details</h2>
            
            {/* Expired Calibration Flash Message */}
            {showFlash && calibrations.length > 0 && 
             new Date(calibrations[0].calibrationtodate) < new Date() && (
              <div className="animate-pulse bg-red-500/20 text-red-100 px-4 py-2 rounded-md mb-2 text-center">
                ⚠️ Equipment Calibration Has Expired ⚠️
              </div>
            )}
            
            {calibrations.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {/* Latest Calibration */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Certificate Details */}
                    <div>
                      <label className="block text-xs font-medium text-teal-100">Certificate Number</label>
                      <div className="text-[12px] text-zinc-100">
                        {calibrations[0].calibcertificate}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-teal-100">Calibrated By</label>
                      <div className="text-[12px] text-zinc-100">
                        {calibrations[0].calibratedby}
                      </div>
                    </div>

                    {/* Dates */}
                    <div>
                      <label className="block text-xs font-medium text-teal-100">Calibration Date</label>
                      <div className="text-[12px] text-zinc-100">
                        {new Date(calibrations[0].calibrationdate).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Updated Valid Until with conditional styling */}
                    <div>
                      <label className="block text-xs font-medium text-teal-100">Valid Until</label>
                      <div className={`${
                        new Date(calibrations[0].calibrationtodate) < new Date()
                          ? 'text-red-400 font-bold'
                          : 'text-zinc-100'
                      } text-[12px]`}>
                        {new Date(calibrations[0].calibrationtodate).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Status with updated styling */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-teal-100">Status</label>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        new Date(calibrations[0].calibrationtodate) > new Date()
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800 font-bold animate-pulse'
                      }`}>
                        {new Date(calibrations[0].calibrationtodate) > new Date()
                          ? 'Valid'
                          : 'EXPIRED'}
                      </div>
                    </div>

                    {/* PO and File Reference */}
                    <div>
                      <label className="block text-xs font-medium text-teal-100">PO Reference</label>
                      <div className="text-[12px] text-zinc-100">
                        {calibrations[0].calibrationpo}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-teal-100">File Reference</label>
                      <div className="text-[12px] text-zinc-100">
                        {calibrations[0].calibfile}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calibration History Button */}
                {calibrations.length > 1 && (
                  <button className="text-xs text-blue-300 hover:text-blue-200 transition-colors">
                    View Calibration History ({calibrations.length - 1} previous records)
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-zinc-300">
                No calibration records found for this asset.
              </div>
            )}
          </div>

          {/* New Custody Section */}
          <div className="bg-emerald-950/20 backdrop-blur-sm rounded-lg shadow-lg p-3 w-full max-w-4xl">
            <h2 className="text-sm font-semibold mb-2 text-emerald-200">Custody Details</h2>
            
            {custodyRecords.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {/* Latest Custody */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 shadow-md ring-1 ring-slate-700/50">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Custodian Details */}
                    <div>
                      <label className="block text-xs font-medium text-teal-100">Custodian</label>
                      <div className="text-sm font-bold text-zinc-100">
                        {custodyRecords[0].custodianempname}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Employee #{custodyRecords[0].custodianempno}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-teal-100">Department</label>
                      <div className="text-[12px] text-zinc-100">
                        {custodyRecords[0].department}
                      </div>
                    </div>

                    {/* Location Details */}
                    <div>
                      <label className="block text-xs font-medium text-teal-100">Location</label>
                      <div className="text-[12px] text-zinc-100">
                        {custodyRecords[0].location}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-teal-100">Rack Location</label>
                      <div className="text-[12px] text-zinc-100">
                        {custodyRecords[0].racklocation}
                      </div>
                    </div>

                    {/* Custody Date */}
                    <div>
                      <label className="block text-xs font-medium text-teal-100">Custody From</label>
                      <div className="text-[12px] text-zinc-100">
                        {new Date(custodyRecords[0].custodyfrom).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Created Info */}
                    <div>
                      <label className="block text-xs font-medium text-teal-100">Created By</label>
                      <div className="text-[12px] text-zinc-100">
                        {custodyRecords[0].createdby}
                        <span className="text-[10px] text-zinc-400 ml-1">
                          on {new Date(custodyRecords[0].createdate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custody History Button */}
                {custodyRecords.length > 1 && (
                  <button className="text-xs text-emerald-300 hover:text-emerald-200 transition-colors">
                    View Custody History ({custodyRecords.length - 1} previous records)
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-zinc-300">
                No custody records found for this asset.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
