"use client";

export function PolicyTrack({
  chairName,
  leftOfChairName,
  rateInput,
  setRateInput,
  onApplyRate
}: {
  chairName: string;
  leftOfChairName: string;
  rateInput: string;
  setRateInput: (value: string) => void;
  onApplyRate: () => void;
}) {
  return (
    <section>
      <div className="zone-heading">
        <h3>Policy Track</h3>
        <p>The chair and the table's money setting sit in the center of the board.</p>
      </div>
      <div className="policy-track-grid">
        <div className="track-card">
          <span className="track-label">Policy Chair</span>
          <strong>{chairName}</strong>
        </div>
        <div className="track-card">
          <span className="track-label">Left of Chair</span>
          <strong>{leftOfChairName}</strong>
        </div>
        <label className="track-card track-card-form">
          <span className="track-label">Set Rate</span>
          <div className="inline-form">
            <input value={rateInput} onChange={(event) => setRateInput(event.target.value)} type="number" step="0.25" />
            <button onClick={onApplyRate}>Apply</button>
          </div>
        </label>
      </div>
    </section>
  );
}
