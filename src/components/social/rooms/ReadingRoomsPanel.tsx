import React, { useState } from "react";
import { useReadingRooms, ReadingRoom as RoomType } from "@/hooks/useReadingRoom";
import { ReadingRoomsList } from "./ReadingRoomsList";
import { ReadingRoom } from "./ReadingRoom";

export const ReadingRoomsPanel: React.FC = () => {
  const { data: rooms = [], isLoading } = useReadingRooms();
  const [activeRoom, setActiveRoom] = useState<RoomType | null>(null);

  if (activeRoom) {
    return <ReadingRoom room={activeRoom} onLeave={() => setActiveRoom(null)} />;
  }

  return (
    <ReadingRoomsList
      rooms={rooms}
      isLoading={isLoading}
      onSelectRoom={(room) => setActiveRoom(room)}
    />
  );
};

export default ReadingRoomsPanel;
