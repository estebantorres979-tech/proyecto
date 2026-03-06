var guarani = function () {
	var ajax_nav_enabled = true;
	var mostrar_mensaje_antes_de_navegar = false;
	var mensaje_antes_de_navegar = '';

	function init_perfiles() {
        $( document ).on( "vclick", "li.js-perfil-item", function(event) {
            event.preventDefault();
			var perfil = $(this).data('perfil');
			window.location.replace(url_cambio_perfil + "?id=" + perfil);
		});
	}

	function init_carreras() {
                
                // SOLO DESKTOP: Se le pone al toggle (el que muestra la carrera seleccionada) el mismo ancho que el dropdown (listado de carreras).
                if($('#js-dropdown-toggle-carreras').length) {
                    $("#js-dropdown-toggle-carreras").outerWidth($("#js-dropdown-menu-carreras").outerWidth(true), true);
                }
                
                // Si hay menos de dos carreras no registro el evento que esta debajo.
                if ($('.js-select-carreras').length < 2) {
                    return false;
                }
                
                $(document).on("vclick", ".js-select-carreras", function (event) {
                    event.preventDefault();
                    var selected = $(this).data('carrera-selected');
                    // Si se trata de la carrera actualmente seleccionada no hago recarga/redirección
                    if (selected) {
                        return false;
                    } 
                    var carrera = $(this).data('carrera-id');
                    window.location.replace(url_cambio_carrera + "?id=" + carrera + "&op=" + kernel_config.op_actual);
                });
                
	}

	function init_links() {
		$('body').on('click', 'a', function () {
			if ($(this).hasClass('js-new-tab')) {
				window.open(this.href);
				return false;
			}
			var cambiar = !$(this).hasClass('no-ajax') && this.href != '' && !this.href.match(/#$/);
			if (cambiar) {
				var params = {href: this.href, cambia_op: true};
				guarani.cambiar_op(params);
				return false;
			}
		});

		$('body').on('click', '.link-in-data', function (e) {
			if ($(e.target).is('a')) { // si apretó en un link lo dejamos pasar
				return true;
			}

			var url = $(this).data('link');
			var params = {href: url, cambia_op: true};
			guarani.cambiar_op(params);
			return false;
		});
	}

	function init_back_to_top() {
		//http://jsfiddle.net/gilbitron/Lt2wH/
		//http://bootsnipp.com/snippets/featured/link-to-top-page
		$(window).scroll(function () {
			if ($(this).scrollTop() > 100) {
				$('#back-to-top').fadeIn();
			} else {
				$('#back-to-top').fadeOut();
			}
		});

		// scroll body to 0px on click
		$( document ).on( "vclick", "#back-to-top", function(e) {
			e.preventDefault();
			$('body,html').animate({
				scrollTop: 0
			}, 800);
			return false;
		});
	}

	function listener_global(paquete) {
		if (paquete.cant_mensajes) {
			var leidos = paquete.cant_mensajes.leidos;
			var total = paquete.cant_mensajes.total;
			var no_leidos = total - leidos;
			if (no_leidos == 0) {
				$('#js-cant-mensajes').removeClass('badge-warning');
			} else {
				$('#js-cant-mensajes').addClass('badge-warning');
			}
			$('#js-cant-mensajes').text(no_leidos);
		}
	}

	/**
	 * @param object req_data tiene la siguiente estructura {url, tiene_mensaje[, mensaje]}
	 */
	function handler_cambio_op(req_data) {
		var conf_nuevo_req = {
			href: req_data.url
		};
		if (req_data.tiene_mensaje) {
			conf_nuevo_req.mensaje_post_navegacion = {
				mensaje: req_data.mensaje,
				options: {tipo: 'alert-success'}
			};
		}
		guarani.cambiar_op(conf_nuevo_req);
	}

	var escalas = {};

	return {
		escalas: function () {
			return {
				registrar: function (id_escala, fn) {
					escalas[id_escala] = fn();
				},

				recuperar: function (id_escala) {
					if (id_escala in escalas) {
						return escalas[id_escala];
					}

					console.log("la escala " + id_escala + " no existe");
					return null;
				}
			}
		},
		set_ajax_nav: function (value) {
			ajax_nav_enabled = value;
		},
		set_condicion_antes_de_navegar: function (fn_condicion, mensaje) {
			kernel.historia.set_fn_mensaje_nav_condicional(fn_condicion);
			kernel.historia.set_mensaje_nav(mensaje);
		},
		set_mensaje_antes_de_navegar: function (mensaje) {
			kernel.historia.set_mostrar_mensaje_nav(true);
			kernel.historia.set_mensaje_nav(mensaje);
		},
		set_mensaje_antes_de_navegar_activo: function (activo) {
			kernel.historia.set_mostrar_mensaje_nav(activo);
		},
		cambiar_op: function (params) {
			if (!ajax_nav_enabled) {
				window.location.href = params.href;
				return false;
			}
			if (!kernel_config.historia_activa) {
				return false;
			}

			kernel.evts.disparar('beforeCambiarOp', {});

			kernel.evts.disparar('guarani.beforeCambiarOp', {});
			var id = '#kernel_contenido';
			var href = params.href;
			var historia = (params.historia || params.historia === false) ? params.historia : true;
			var show_loading = (params.show_loading || params.show_loading === false) ? params.show_loading : true;
			var mensaje_post_navegacion = (params.mensaje_post_navegacion) ? params.mensaje_post_navegacion : false;

			// hack para esconder el menu
			$('.dropdown').removeClass('open');
			$('.nav-collapse').removeClass('in').css('height', 0);


			kernel.ajax.load(href, id, {
				success: function (paquete) {
					// se tiene que setear explícitamente en cada operación
					if (paquete.operacion && !paquete.deshabilitar_actualizacion_menu) {
						var menu_item = $('#' + paquete.operacion);
						if (!menu_item.hasClass('js-menuitem-root')) {
							menu_item = menu_item.parents('.js-menuitem-root');
						}
						$('#js-nav').find('.js-menuitem-root').removeClass('menu-item-seleccionado');
						menu_item.addClass('menu-item-seleccionado');
//						clearMenus();
					}
					kernel.evts.disparar('operacion_cambiada', {href: params.href});
					if (mensaje_post_navegacion !== false) {
						kernel.ui.show_mensaje(mensaje_post_navegacion.mensaje, mensaje_post_navegacion.options);
					}
				},
				historia: historia,
				url_actual: (params.url_actual) ? params.url_actual : null,
				forzar_cambio_op: true,
				show_loading: show_loading
			});
		},

		init: function () {
			init_perfiles();
			init_carreras();
			init_links();
			init_back_to_top();
			$('body').on("click", function () {
				$('.dropdown').removeClass('open');
			});
			$('body').on('click', '.js-btn-back', function () {
				guarani.cambiar_op({href: $(this).data('url-back')});
				return false;
			});
			$('body').on('click', '.js-history-back', function () {
				kernel.historia.back();
				return false;
			});

			var selector_perfil = $('#js-selector-perfiles');
			if (selector_perfil.length > 0) {
				var perfil_actual = selector_perfil.find('.js-seleccion-perfil').data('perfilnombre');
				selector_perfil.find('.js-texto-perfil').html('Perfil: ' + perfil_actual);
			}

			kernel.ajax.set_listener_response(listener_global);
			kernel.ajax.set_handler_cambio_op(handler_cambio_op);
//			kernel.evts.escuchar('cambio_operacion', guarani.cambiar_op, true);

            //http://api.jquery.com/ajaxStop/
            //Se dispara cuando se terminan todos los AJAXs
            $(document).ajaxStop(function () {
                setTimeout(function () {
					$('[data-toggle="tooltip"]').tooltip();
					$('[data-toggle="popover"]').popover();
                    //Si el parametro 'habilitar_sugerencias_autocompletar_input' esta en 'false' quito las sugerencias/autocomplete a los inputs
                    if(!autocompletar_input_habilitado){
                        $("form, input").attr("autocomplete", "off");
                        $("form, input").prop("autocomplete", "off");
                    }
                }, 1000);
            });

		}
	}
}();

$(document).ready(function () {
	guarani.init();
});

function __kolla_encuesta_respondida(hab, param) {
	kernel.renderer.pagelet('encuesta').callback(hab, param);
}