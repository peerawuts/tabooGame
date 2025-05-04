export default function RoomForm() {
  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = new FormData(event.target);
    const formData = Object.fromEntries(form.entries());

    console.log(formData);
    if(formData.roomName.length == 0) {
        alert("Please enter room name!");
    }else if(formData.memberName.length == 0 ) {
        alert("Please enter player name!");
    }else{
        const res = await fetch('/api/rooms', {
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });

        const result = await res.json();
        console.log(result);
        if (result == formData.roomName) {
            alert("ชื่อห้อง " + formData.roomName + " มีผู้ใช้ไปแล้ว โปรดตั้งชื่ออื่นแทน")
        }else{
            alert("โปรดใช้รหัสสมาชิกนี้ในการ join ห้อง " + formData.roomName + "\n \n" + result.participantId + "\n \n และรหัสกุญแจห้องนี้สำหรับเพิ่มสมาชิกห้อง \n \n" + (result.tag).split("/").pop() + " \n");
        }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="roomName" className="form-label">
        ตั้งชื่อห้องใหม่ / Room Name
      </label>
      <input name="roomName" type="text" className="form-control" />

      <label htmlFor="memberName" className="form-label">
        ตั้งชื่อเจ้าของห้อง / Owner Name
      </label>
      <input name="memberName" type="text" className="form-control" />

      <input name="score" type="hidden" value="0" className="form-control" />
      <input name="token" type="hidden" value="" className="form-control" />

      <button className="btn btn-primary" type="submit">
        สร้างห้อง / Create Room
      </button>
    </form>
  );
}
