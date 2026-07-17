export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-32 rounded-xl skeleton mb-2"/>
        <div className="h-5 w-56 rounded-lg skeleton"/>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {[1,2,3,4].map(i=>(
          <div key={i} className="card overflow-hidden">
            <div className="h-2 skeleton rounded-none"/>
            <div className="p-5 space-y-3">
              <div className="h-11 w-11 rounded-xl skeleton"/>
              <div className="h-5 w-3/4 rounded-lg skeleton"/>
              <div className="h-4 w-full rounded skeleton"/>
              <div className="h-4 w-1/2 rounded skeleton"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
