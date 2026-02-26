package content;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.Before;
import org.junit.Test;

public class Tests {
	private StringContent.builder builder = StringContent.builder.get();
	private Content<String> prova;
	private Content<String> ariprova;
	private Author author;

	@Before
	public void setup() {
		this.author = Author.getNewAuthor("Massimo Ceccherini");
		this.prova = builder.withAuthor(author)
				.withContent("prova")
				.build();
		this.ariprova = builder.withAuthor(author)
				.withContent("ariprova")
				.build();
	}

	@Test
	public void linkTest() {
		prova.link(ariprova);

		assertThat(prova.links()).hasSameElementsAs(ariprova.links());

		Link<?, ?> formedLink = prova.links().stream()
				.findFirst()
				.get();

		assertThat(formedLink.first()).isEqualTo(prova);

		assertThat(formedLink.second()).isEqualTo(ariprova);
	}
	
	@Test
	public void hybridLink() {
		IntegerContent i = IntegerContent.getNewContent(126, author);
		assertThat(i.show().equals(126));
		prova.link(i);
		assertThat(prova.links().containsAll(i.links()));
		
		Link<?, ?> formedLink = i.links().stream()
				.findFirst()
				.get();
		
		assertThat(formedLink.first()).isEqualTo(prova);
		assertThat(formedLink.second()).isEqualTo(i);
		
		assertThat(formedLink.second().show()).isEqualTo(i.show());
		assertThat(formedLink.first().show()).isEqualTo(prova.show());
		
		i.link(ariprova);
		
		Link<?, ?> newFormedLink = i.links().stream().filter(c -> !c.equals(formedLink)).findFirst().get();
		
		assertThat(newFormedLink.first()).isEqualTo(i);
		assertThat(newFormedLink.second()).isEqualTo(ariprova);
		
		assertThat(newFormedLink.second().show()).isEqualTo(ariprova.show());
		assertThat(newFormedLink.first().show()).isEqualTo(i.show());
	}

	@Test
	public void contentTest() {
		assertThat(prova.show()).isEqualTo("prova");
		assertThat(ariprova.show()).isEqualTo("ariprova");
	}

	@Test
	public void authorTest() {
		assertThat(author.getName()).isEqualTo("Massimo Ceccherini");
		assertThat(author.getPublishedContent()).hasSize(2);
		assertThat(author.getPublishedContent()).contains(prova);
		assertThat(author.getPublishedContent()).contains(ariprova);

	}

}
