
import { useState } from "react";
import { Calendar, Clock, Users, Video, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface Author {
  id: number;
  name: string;
  availableSlots: string[];
}

interface ScheduleSessionDialogProps {
  author: Author;
  trigger: React.ReactNode;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00"
];

export const ScheduleSessionDialog = ({ author, trigger }: ScheduleSessionDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionType, setSessionType] = useState("individual");
  const [sessionFormat, setSessionFormat] = useState("video");
  const [notes, setNotes] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for your session.",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally send the data to your backend
    const sessionData = {
      authorId: author.id,
      date: selectedDate,
      time: selectedTime,
      type: sessionType,
      format: sessionFormat,
      notes: notes,
    };

    console.log("Scheduling session:", sessionData);

    toast({
      title: "Session Scheduled!",
      description: `Your ${sessionType} session with ${author.name} has been scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
    });

    // Reset form and close dialog
    setSelectedDate(undefined);
    setSelectedTime("");
    setSessionType("individual");
    setSessionFormat("video");
    setNotes("");
    setIsOpen(false);
  };

  const isDateAvailable = (date: Date) => {
    // Simple logic - you can enhance this based on author's actual availability
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months ahead
    
    return date >= today && date <= maxDate && date.getDay() !== 0; // No Sundays
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Schedule Session with {author.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Session Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Session Type</Label>
            <RadioGroup value={sessionType} onValueChange={setSessionType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Individual Session (1-on-1)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Group Session (Multiple participants)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Session Format */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Session Format</Label>
            <RadioGroup value={sessionFormat} onValueChange={setSessionFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video Call
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-person" id="in-person" />
                <Label htmlFor="in-person" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  In-Person Meeting
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Date</Label>
            <div className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => !isDateAvailable(date)}
                className="rounded-md border"
              />
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-semibold">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any specific topics you'd like to discuss or questions you have..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Session Details Preview */}
          {selectedDate && selectedTime && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">Session Summary</h3>
              <div className="space-y-1 text-sm text-amber-800">
                <p><strong>Author:</strong> {author.name}</p>
                <p><strong>Date:</strong> {selectedDate.toLocaleDateString()}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Type:</strong> {sessionType === "individual" ? "Individual" : "Group"} Session</p>
                <p><strong>Format:</strong> {sessionFormat === "video" ? "Video Call" : "In-Person"}</p>
                {notes && <p><strong>Notes:</strong> {notes}</p>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSchedule}
              className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              disabled={!selectedDate || !selectedTime}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Session
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="border-gray-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
