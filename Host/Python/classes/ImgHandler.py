import os
import yaml
from ultralytics import YOLO

class ImgHandler:
    
    def __init__(self):
        self.get_parameters()
        self.model = YOLO(self.general_params["model"])
    
    def segment_objs(self, frame):
        # Tenta segmentar 
        results = self.model(frame)
        if results is not None:
            return results[0].plot()
        # Retorna None se nao conseguiu segmentar
        return None

    def get_parameters(self):
        # Diretório do arquivo atual (classes/)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        # Sobe um nível -> Host/Python/
        project_dir = os.path.dirname(base_dir)
        # Caminho correto do config
        config_path = os.path.join(project_dir, 'config', 'general_config.yml')
        # Checa se arquivo existe
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Config não encontrado: {config_path}")
        # Le arquivo
        with open(config_path, "r") as f:
            self.general_params = yaml.safe_load(f)
