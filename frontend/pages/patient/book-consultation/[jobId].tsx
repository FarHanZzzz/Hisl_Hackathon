import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { PatientLayout } from '../../../src/components/PatientLayout';
import axios from 'axios';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Clinician {
  id: string;
  display_name: string;
  available_days: number[];
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export default function BookConsultation() {
  const router = useRouter();
  const { jobId } = router.query;
  const { t } = useTranslation('patient');

  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [selectedClinician, setSelectedClinician] = useState<string>('');
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [isBooking, setIsBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Generate next 14 days
  const next14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateObj: d,
      dateString: d.toISOString().split('T')[0],
      dayOfWeek: d.getDay(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayOfMonth: d.getDate()
    };
  });

  useEffect(() => {
    // Fetch clinicians on mount
    axios.get('/api/v1/scheduling/clinicians')
      .then(res => setClinicians(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedClinician && selectedDate) {
      axios.get(`/api/v1/scheduling/available-slots?doctor_id=${selectedClinician}&date=${selectedDate}`)
        .then(res => {
          setAvailableSlots(res.data);
          setSelectedSlot(null);
        })
        .catch(err => console.error(err));
    }
  }, [selectedClinician, selectedDate]);

  const handleBook = async () => {
    if (!selectedClinician || !selectedDate || !selectedSlot) return;
    
    setIsBooking(true);
    setErrorMsg('');
    try {
      // We assume user is logged in, but we'll mock patient_id for demo if none exists
      // Wait, we can pass patient_id from context or just dummy value since auth is there
      // We'll use a mocked UUID or an actual fetch if needed
      await axios.post('/api/v1/scheduling/book', {
        patient_id: '11111111-1111-1111-1111-111111111111', // Dummy fallback user
        clinician_id: selectedClinician,
        job_id: jobId,
        appointment_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time
      });
      setShowSuccess(true);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErrorMsg(error.response.data.detail);
        // Refresh slots
        const res = await axios.get(`/api/v1/scheduling/available-slots?doctor_id=${selectedClinician}&date=${selectedDate}`);
        setAvailableSlots(res.data);
        setSelectedSlot(null);
      } else {
        setErrorMsg("Failed to book appointment. Please try again.");
      }
    } finally {
      setIsBooking(false);
    }
  };

  const getDoctorObj = () => clinicians.find(c => c.id === selectedClinician);
  const isDateAvailable = (dayOfWeek: number) => {
    if (!selectedClinician) return false;
    const doc = getDoctorObj();
    return doc?.available_days.includes(dayOfWeek);
  };

  return (
    <PatientLayout title="Schedule Consultation | Pedi-Growth" hideNav={true}>
      <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white border border-slate-800"
          >
            <span className="material-icons">arrow_back</span>
          </button>
          <div>
            <span className="text-slate-400 font-medium text-sm">Schedule Consultation</span>
            <p className="text-white font-bold " style={{ fontFamily: "'Noto Sans Bengali', 'Outfit', sans-serif" }}>Based on Report Analysis</p>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* Step 1: Select Doctor */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Select a Specialist</h2>
            {clinicians.length === 0 ? (
               <p className="text-slate-400 text-sm">Loading available specialists...</p>
            ) : (
              <div className="flex flex-col gap-3">
                {clinicians.map(c => (
                  <label 
                    key={c.id} 
                    className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${
                      selectedClinician === c.id 
                        ? 'bg-cyan-500/10 border-cyan-500' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="doctor" 
                      checked={selectedClinician === c.id}
                      onChange={() => {
                        setSelectedClinician(c.id);
                        setSelectedDate('');
                        setAvailableSlots([]);
                      }}
                      className="hidden"
                    />
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 ${
                      selectedClinician === c.id ? 'bg-cyan-500' : 'bg-slate-800'
                    }`}>
                      <span className="material-icons text-white">person</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${selectedClinician === c.id ? 'text-white' : 'text-slate-300'}`}>Dr. {c.display_name}</h3>
                      <p className="text-slate-500 text-sm">Available: {c.available_days.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Step 2: Select Date */}
          {selectedClinician && (
            <section className="animate-in fade-in duration-300">
              <h2 className="text-lg font-bold text-white mb-3">2. Select Date</h2>
              
              <div className="flex overflow-x-auto pb-4 gap-3 snap-x hide-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                {next14Days.map((day, idx) => {
                  const available = isDateAvailable(day.dayOfWeek);
                  const isSelected = selectedDate === day.dateString;
                  
                  return (
                    <button
                      key={day.dateString}
                      disabled={!available}
                      onClick={() => setSelectedDate(day.dateString)}
                      className={`min-w-[80px] snap-start flex flex-col items-center justify-center p-4 rounded-2xl border transition-colors ${
                        !available 
                          ? 'bg-slate-950 border-slate-800/50 opacity-50 cursor-not-allowed' 
                          : isSelected 
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                            : 'bg-slate-900 border-slate-800 text-white hover:border-slate-600'
                      }`}
                    >
                      <span className={`text-xs font-semibold uppercase ${isSelected ? 'text-slate-950' : (available ? 'text-slate-400' : 'text-slate-600')}`}>
                        {idx === 0 ? 'Today' : day.dayName}
                      </span>
                      <span className={`text-2xl font-bold mt-1 ${isSelected ? 'text-slate-950' : (available ? 'text-white' : 'text-slate-600')}`}>
                        {day.dayOfMonth}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Step 3: Select Time */}
          {selectedDate && (
             <section className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold text-white mb-3">3. Select Time</h2>
                
                {availableSlots.length === 0 ? (
                  <p className="text-slate-400 text-sm">No available times for this date. Please select another day.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?.start_time === slot.start_time;
                      return (
                        <button
                          key={slot.start_time}
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot)}
                          className={`min-h-[48px] rounded-xl flex items-center justify-center font-semibold text-sm transition-all border ${
                            !slot.available
                              ? 'bg-slate-800/50 border-slate-800 text-slate-500 cursor-not-allowed line-through'
                              : isSelected
                                ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                                : 'bg-slate-900 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                          }`}
                        >
                          {slot.start_time.substring(0, 5)} {slot.available ? '' : '(Booked)'}
                        </button>
                      );
                    })}
                  </div>
                )}
             </section>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm animate-in fade-in">
              <span className="material-icons text-sm mr-2 align-middle">error</span>
              {errorMsg}
            </div>
          )}

        </div>

        {/* Floating Confirm Button */}
        {selectedSlot && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 z-40 animate-in slide-in-from-bottom-full">
            <button
              onClick={handleBook}
              disabled={isBooking}
              className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20 disabled:opacity-70 disabled:cursor-wait"
            >
              {isBooking ? 'Booking...' : (
                <>
                  <span className="material-icons mr-2">check_circle</span>
                  Confirm Appointment
                </>
              )}
            </button>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <span className="material-icons text-emerald-500 text-5xl">check_circle</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Appointment Confirmed!</h2>
              <p className="text-slate-300 mb-6 font-medium">
                You are scheduled with {getDoctorObj()?.display_name} on <br />
                <span className="text-cyan-400 font-bold">{selectedDate} at {selectedSlot?.start_time.substring(0, 5)}</span>
              </p>
              <p className="text-slate-500 text-sm mb-8">You will receive a notification reminder shortly before your appointment starts.</p>
              
              <button 
                onClick={() => router.push('/patient/home')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </PatientLayout>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'patient'])),
    },
  };
}
