from picamera2 import Picamera2

class CameraHandler:
    def __init__(self, width=640:float, height=480:float)->None:
        # Initialize Picamera2
        self.picam2 = Picamera2()
        self.picam2.configure(picam2.create_preview_configuration(main={"size": (width, height)}))
    
    def start_camera(self)->None:
        self.picam2.start()
        
    def get_frame():
        try:
            return self.picam2.capture_array()
        except:
            return None 
