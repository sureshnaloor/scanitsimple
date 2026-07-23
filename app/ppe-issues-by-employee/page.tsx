import PPEIssuesByEmployee from '@/components/PPEIssuesByEmployee';

export default function PPEIssuesByEmployeePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          PPE Issues by Employee
        </h1>
        <p className="text-gray-600">
          Search for an employee to view their complete PPE issue history.
        </p>
      </div>

      <PPEIssuesByEmployee />
    </div>
  );
}
