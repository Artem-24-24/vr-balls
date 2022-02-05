import * as THREE from 'three/build/three.module.js'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {VRButton} from "three/examples/jsm/webxr/VRButton"
import {BoxLineGeometry} from "three/examples/jsm/geometries/BoxLineGeometry"
import {XRControllerModelFactory} from "three/examples/jsm/webxr/XRControllerModelFactory";
import flashLightPack from "../assets/flash-light.glb"
import AxePack from "../assets/Axe.glb"
import officeChairGlb from "../assets/Tree_House.glb"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {controllers} from "three/examples/jsm/libs/dat.gui.module";
import {SpotLightVolumetricMaterial} from "./utils/SpotLightVolumetricMaterial";
import {FlashLightController} from "./controllers/FlashLightController";
import {fetchProfile} from "three/examples/jsm/libs/motion-controllers.module";
import {CanvasUI} from "./utils/CanvasUI";


const DEFAULT_PROFILES_PATH = 'webxr-input-profiles';
const DEFAULT_PROFILE = 'generic-trigger';

class App {
  constructor() {
    const container = document.createElement('div')
    document.body.appendChild(container)

    // this.camera = new THREE.PerspectiveCamera(60,
    //     window.innerWidth / window.innerHeight, 0.1, 100)
    // this.camera.position.set(0, 0, 4)
    this.camera = new THREE.PerspectiveCamera(50,
        window.innerWidth / window.innerHeight, 0.1, 100)
    this.camera.position.set(0, 1.6, 3)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x505050)

    // const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3)
    const ambient = new THREE.HemisphereLight(0x606060, 0x404040, 1)
    this.scene.add(ambient)

    const light = new THREE.DirectionalLight(0xfffff)
    // light.position.set(0.2, 1, 1)
    light.position.set(1, 1, 1).normalize()
    this.scene.add(light)

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.outputEncoding = THREE.sRGBEncoding
    container.appendChild(this.renderer.domElement)

    this.controllers = []
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 1.6, 0)
    this.controls.update()

    this.raycaster = new THREE.Raycaster()
    this.workingMatrix = new THREE.Matrix4()

    this.controllers = []
    this.spotlights = {}

    // this.initSceneCube()
    this.initScene()
    this.forDebugOnly()
    this.loadGltf()
    this.setupVR()
    this.clock = new THREE.Clock()
    this.renderer.setAnimationLoop(this.render.bind(this))

    window.addEventListener('resize', this.resize.bind(this))
  }

  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  initSceneCube() {
    const geometry = new THREE.BoxBufferGeometry()
    const material = new THREE.MeshStandardMaterial({color: 0xFF0000})

    this.mesh = new THREE.Mesh(geometry, material)

    this.scene.add(this.mesh)

    this.scene.add(this.mesh)

    const geometrySphere = new THREE.SphereGeometry(.7, 32, 16)
    const materialSphere = new THREE.MeshBasicMaterial({color: 0xffff00})
    const sphere = new THREE.Mesh(geometrySphere, materialSphere)
    this.scene.add(sphere)

    // sphere.position.set(1.5, 0, 0)
  }

  forDebugOnly() {
    const geometrySphere = new THREE.SphereGeometry(.5, 32, 16)
    const materialSphere = new THREE.MeshBasicMaterial({color: 0xffff00})
    const sphere = new THREE.Mesh(geometrySphere, materialSphere)
    sphere.position.set(0, 1.5, -2)
    this.scene.add(sphere)
  }

  initScene() {
    this.radius = 0.08

    this.movableObjects = new THREE.Group();
    this.scene.add(this.movableObjects);

    this.room = new THREE.LineSegments(
        new BoxLineGeometry(6, 6, 6, 10, 10, 10),
        new THREE.LineBasicMaterial({color: 0x808080})
    )
    this.room.geometry.translate(0, 3, 0)
    // this.scene.add(this.room)

    const geometry = new THREE.IcosahedronBufferGeometry(this.radius, 2)

    for (let i = 0; i < 0; i++) {

      const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff}))

      object.position.x = this.random(-2, 2)
      object.position.y = this.random(0, 2)
      object.position.z = this.random(-2, 2)

      //this.room.add( object )
      this.movableObjects.add(object)

      // this.room.add(objects)

    }
    this.highlight = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0xFFFFF, side: THREE.BackSide
    }))
    this.highlight.scale.set(1.2, 1.2, 1.2)
    this.scene.add(this.highlight)

    this.ui = this.createUI()
  }

  loadGltf() {
    const self = this
    const loader = new GLTFLoader()
    loader.load(
        officeChairGlb,
        (gltf) => {
          self.chair = gltf.scene
          self.chair.scale.set(.4, .4, .4)
          // self.chair.scale.set(1,1,1)
          // self.chair.scale = new THREE.Vector3(.2,.2,.2)
          self.scene.add(gltf.scene)
          // self.loadingBar.visible = false
          self.renderer.setAnimationLoop(self.render.bind(self))

          self.chair.position.x = 1;
          self.chair.position.y = 6;
        },
        null,
        // (xhr) => {
        //   self.loadingBar.progress = xhr.loaded/xhr.total
        // },

        err => {
          console.error(`An error happened: ${err}`)
        }
    )
  }

  setupVR() {
    this.renderer.xr.enabled = true
    document.body.appendChild(VRButton.createButton(this.renderer))

    let i = 0
    //this.AxeController(i++)
    // this.flashLightController(i++)
    this.buildStandardController(i++)
    // this.buildStandardController(i++)

    //his.buildDragController(i++)
    //this.flashLightController(i++)
    //this.buildStandardController(i++)
    //this.controllers[i] = new FlashLightController(this.renderer, i++, this.scene, this.movableObjects, this.highlight)
    // this.buildStandardController(i++)

    if (this.controllers.length > 1) {
      this.leftUi = this.createUI()
      this.leftUi.mesh.position.set(-.6, 1.5, -1)
      this.rightUi = this.createUI()
      this.rightUi.mesh.position.set(.6, 1.5, -1)
    } else {
      this.leftUi = this.createUI()
    }
  }
  createUI() {
    const config = {
      panelSize: {height: 0.8},
      height: 500,
      body: {type: "text"}
    }
    const ui = new CanvasUI({body: ""}, config);
    ui.mesh.position.set(0, 1.5, -1);
    this.scene.add(ui.mesh);
    return ui;
  }

  updateUI(ui, buttonStates) {
    if (!buttonStates) {
      return
    }

    const str = JSON.stringify(buttonStates, null, 2);
    if (!ui.userData || ui.userData.strStates === undefined
        || (str != ui.userData.strStates)) {
      ui.updateElement('body', str);
      ui.update();
      if (!ui.userData) {
        ui.userData = {}
      }
      ui.userData.strStates = str;
    }
  }



  createButtonStates(components) {
    const buttonStates = {}
    this.gamepadIndices = components
    Object.keys(components).forEach(key => {
      if (key.includes('touchpad') || key.includes('thumbstick')) {
        buttonStates[key] = {button: 0, xAxis: 0, yAxis: 0}
      } else {
        buttonStates[key] = 0
      }
    })
    this.buttonStates = buttonStates
  }

  updateGamepadState() {
    const session = this.renderer.xr.getSession()
    const inputSource = session.inputSources[0]
    if (inputSource && inputSource.gamepad && this.gamepadIndices && this.buttonStates) {
      const gamepad = inputSource.gamepad
      try {
        Object.entries(this.buttonStates).forEach(([key, value]) => {
          const buttonIndex = this.gamepadIndices[key].button
          if (key.includes('touchpad') || key.includes('thumbstick')) {
            const xAxisIndex = this.gamepadIndices[key].xAxis
            const yAxisIndex = this.gamepadIndices[key].yAxis
            this.buttonStates[key].button = gamepad.buttons[buttonIndex].value
            this.buttonStates[key].xAxis = gamepad.axes[xAxisIndex].toFixed(2)
            this.buttonStates[key].yAxis = gamepad.axes[yAxisIndex].toFixed(2)
          } else {
            this.buttonStates[key] = gamepad.buttons[buttonIndex].value
          }
        })
      } catch (e) {
        console.warn("An error occurred setting the ui")
      }
    }
  }

  onConnect(event, self) {
    // const self = this
    const info = {};


    fetchProfile(event.data, DEFAULT_PROFILES_PATH, DEFAULT_PROFILE)
        .then(({profile, assetPath}) => {
        //console.log(JSON.stringify(profile));

        info.name = profile.profileId;
        info.targetRayMode = event.data.targetRayMode;

        Object.entries(profile.layouts).forEach(([key, layout]) => {
          const components = {};
          Object.values(layout.components).forEach((component) => {
            components[component.rootNodeName] = component.gamepadIndices;
          });
          info[key] = components;
        });

        if (event.data.handedness === 'left') {
          self.createButtonStates(info.left);
        } else {
          self.createButtonStates(info.right);
        }
      });
    }

  showDebugText(dt) {
    if (this.renderer.xr.isPresenting) {
      this.elapsedTime += dt
      if (this.elapsedTime > 0.3) {
        this.elapsedTime = 0
        if (this.controllers.length > 0) {
          this.updateUI(this.leftUi, this.controllers[0].buttonStates)
        }
        if (this.controllers.length > 1) {
          this.updateUI(this.rightUi, this.controllers[1].buttonStates)
        }
      }
    } else {
      // this.stats.update()
    }
  }

  AxeController(index) {
    const self = this

    let controller = this.renderer.xr.getController(index)


    controller.addEventListener( 'connected', function (event) {
      self.buildAxeController.call(self, event.data, this)
    })
    controller.addEventListener( 'disconnected', function () {
      while(this.children.length > 0) {
        this.remove(this.children[0])
        const controllerIndex = self.controllers.indexOf(this)
        self.controllers[controllerIndex] = null
      }
    })
    controller.handle = () => {}

    this.controllers[index] = controller
    this.scene.add(controller)
  }


  buildAxeController(data, controller ) {
    let geometry, material, loader

    const self = this

    if (data.targetRayMode === 'tracked-pointer') {
      loader = new GLTFLoader()
      loader.load(AxePack, (gltf) => {
            // const axe = gltf.scene.children[1]
            const axe = gltf.scene
            const scale = 0.5
            axe.scale.set(scale, scale, scale)
            axe.position.set(-1.3,-0.2,0)
            axe.rotation.set(0,Math.PI / -2, 0)
            controller.add(axe)
            const spotlightGroup = new THREE.Group()
            self.spotlights[controller.uuid] = spotlightGroup

            const spotlight = new THREE.SpotLight(0xFFFFFF, 2, 12, Math.PI / 15, 0.3)
            spotlight.position.set(0, 0, 0)
            spotlight.target.position.set(0, 0, -1)
            spotlightGroup.add(spotlight.target)
            spotlightGroup.add(spotlight)
            controller.add(spotlightGroup)

            spotlightGroup.visible = false

            geometry = new THREE.CylinderBufferGeometry(0.03, 1, 5, 32, true)
            geometry.rotateX(Math.PI / 2)
            material = new SpotLightVolumetricMaterial()
            const cone = new THREE.Mesh(geometry, material)
            cone.translateZ(-2.6)
            spotlightGroup.add(cone)

          },

          null,

          (error) => console.error(`An error happened: ${error}`)
      )

  }
}

  buildDragController(index) {
    const controllerModelFactory = new XRControllerModelFactory()
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    ])
    const line = new THREE.Line(geometry)
    line.name = 'line'
    line.scale.z = 10

    const controller = this.renderer.xr.getController(index)

    controller.add(line)
    controller.userData.selectPressed = false

    const grip = this.renderer.xr.getControllerGrip(index)
    grip.add(controllerModelFactory.createControllerModel(grip))
    this.scene.add(grip)

    const self = this

    function onSelectStart(event) {
      const controller = event.target;
      const intersections = getIntersections(controller);

      if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        object.material.emissive.r = 1;
        controller.attach(object)
        controller.userData.selected = object;
      }
    }

    function onSelectEnd (event) {
      const controller = event.target;

      if (controller.userData.selected !== undefined) {
        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        self.movableObjects.attach(object);
        controller.userData.selected = undefined;
      }
    }

    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('selectend', onSelectEnd);

    const tempMatrix = new THREE.Matrix4();
    const rayCaster = new THREE.Raycaster();
    const intersected = [];

    controller.handle = () => {
      cleanIntersected();
      intersectObjects(controller)
    }
    this.scene.add(controller)
    this.controllers[index] = controller

    function getIntersections(controller) {

      tempMatrix.identity().extractRotation(controller.matrixWorld);

      rayCaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      rayCaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      return rayCaster.intersectObjects(self.movableObjects.children);
    }

    function  intersectObjects(controller) {
      // Do not highlight when already selected
      if (controller.userData.selected !== undefined) return;

      const line = controller.getObjectByName('line')
      const intersections = getIntersections(controller)

      if (intersections.length > 0 ) {
        const intersection = intersections[0];

        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push(object)

        line.scale.z = intersection.distance;
      } else {
        line.scale.z = 5;
      }
    }

    function  cleanIntersected() {
      while (intersected.length) {
        const object = intersected.pop();
        object.material.emissive.r = 0;
      }
    }
  }

  buildStandardController(index) {
    const controllerModelFactory = new XRControllerModelFactory()
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    ])
    const line = new THREE.Line(geometry)
    line.name = 'line'
    line.scale.z = 0

    const controller = this.renderer.xr.getController(index)

    controller.add(line)
    controller.userData.selectPressed = false

    const grip = this.renderer.xr.getControllerGrip(index)
    grip.add(controllerModelFactory.createControllerModel(grip))
    this.scene.add(grip)

    const self = this

    function onSelectStart() {
      this.children[0].scale.z = 10
      this.userData.selectPressed = true
    }

    function onSelectEnd () {
      this.children[0].scale.z = 0
      self.highlight.visible = false
      this.userData.selectPressed = false

      }
    controller.addEventListener('selectstart', onSelectStart)
    controller.addEventListener('selectend', onSelectEnd)


    // controller.addEventListener( 'connected', function (event) {
    //   self.onConnect.call(self, event.data, this)
    // })
    controller.addEventListener( 'connected', event => this.onConnect(event, self))

    controller.handle = () => this.handleController(controller)

    this.scene.add(controller)
    this.controllers[index] = controller
  }

  handleController(controller) {
    if (controller.userData.selectPressed) {
      controller.children[0].scale.z = 0.7
      this.workingMatrix.identity().extractRotation( controller.matrixWorld)

      this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld)

      this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.workingMatrix)

      const intersects = this.raycaster.intersectObjects(this.room.children)

      if (intersects.length > 0) {
        if (intersects[0].object.uuid !== this.highlight.uuid) {
          intersects[0].object.add(this.highlight)
        }
        this.highlight.visible = true
        controller.children[0].scale.z = intersects[0].distance
      } else {
        this.highlight.visible = false
      }
    }
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  render() {
    if (this.mesh) {
      this.mesh.rotateX(0.005)
      this.mesh.rotateY(0.01)
    }
    if (this.controllers) {
      this.controllers.forEach(controller => controller.handle())
    }
    this.showDebugText()
    this.renderer.render(this.scene, this.camera)
  }
}

export {App}
