package br.univille.chamados;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@SpringBootApplication
@EnableSpringDataWebSupport
public class ChamadosApplication {
	public static void main(String[] args) {
		SpringApplication.run(ChamadosApplication.class, args);
	}
}
