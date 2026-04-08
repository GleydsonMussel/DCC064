# DCC064

Repositorio para codigos do trabalho da disciplina DCC064, Sistemas Distribuidos.

## ROS

### Docker

Para testar/desenvolver sem ter a Raspberry em maos, 'e poss'ivel utilizar o Docker:

Para ter a arquitetura `ARM` em um X86, 'e necessario rodar:
```console
sudo docker run --privileged --rm tonistiigi/binfmt --install all
```
Feito isso, builde o container:
```console
docker compose up --build
```

Recomenda-se utilizar o dev-container, o que pode ser aberto e utilizado pressionando:
`Ctrl` + `Shift` + `p`.

### Configura'c~ao da c^amera

