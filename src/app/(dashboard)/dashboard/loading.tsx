export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-2xl skeleton" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i=><div key={i} className="h-24 rounded-2xl skeleton"/>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-48 rounded-2xl skeleton"/>
        <div className="h-48 rounded-2xl skeleton"/>
      </div>
    </div>
  );
}
