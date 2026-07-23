'use client';

import PPEStockDisplay from '@/components/PPEStockDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PPEStockPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">PPE Stock Management</h1>
        <p className="text-gray-600">Monitor and manage PPE inventory levels</p>
      </div>

      <Tabs defaultValue="all-stock" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all-stock">All Stock</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock Alert</TabsTrigger>
        </TabsList>

        <TabsContent value="all-stock">
          <Card>
            <CardHeader>
              <CardTitle>Complete PPE Stock Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <PPEStockDisplay showLowStock={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <PPEStockDisplay showLowStock={true} lowStockThreshold={10} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
