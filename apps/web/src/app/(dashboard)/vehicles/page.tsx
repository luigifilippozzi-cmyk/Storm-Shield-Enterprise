export default function VehiclesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vehicles</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Add Vehicle
        </button>
      </div>
      <div className="rounded-lg border">
        <p className="p-8 text-center text-muted-foreground">Vehicle list coming soon</p>
      </div>
    </div>
  );
}
