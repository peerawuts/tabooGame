export default function AddMemberForm() {
  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = new FormData(event.target);
    const formData = Object.fromEntries(form.entries());

    console.log(formData);

    if(formData.roomName.length == 0) {
        alert("Please enter room name!");
    }else if(formData.memberName.length == 0 ) {
        alert("Please enter player name!");
    }else if(formData.roomKey.length == 0 ){
        alert("Please enter Room Key!");
    }else{
        const res = await fetch('/api/members', {
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });
        const result = await res.json();
        console.log(result);
        if (res.status === 500 )
            alert("ชื่อห้อง " + formData.roomName + " หรือรหัสกุญแจห้องไม่ถูกต้อง!");
        else
            alert("โปรดใช้รหัสสมาชิกนี้ในการ join ห้อง " + formData.roomName + " \n \n" + result);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="roomName" className="form-label">
        ชื่อห้อง / Room Name
      </label>
      <input name="roomName" type="text" className="form-control" />

      <label htmlFor="memberName" className="form-label">
        ตั้งชื่อ สมาชิกใหม่ / Member Name
      </label>
      <input name="memberName" type="text" className="form-control" />

      <input name="score" type="hidden" value="0" className="form-control" />
      <input name="token" type="hidden" value="" className="form-control" />

      <label htmlFor="roomKey" className="form-label">
        รหัสกุญแจห้อง / Room Key
      </label>
      <input name="roomKey" type="text" className="form-control" />

      <button className="btn btn-primary" type="submit">
        เพิ่มสมาชิกห้อง / Add New Member
      </button>
    </form>
  );
}
