package content.version;
import static org.assertj.core.api.Assertions.assertThat;
import org.junit.Before;
import org.junit.Test;
import content.Author;
import content.Content;
import content.StringContent;

public class VersionTest {
	
	private StringContent.builder builder = StringContent.builder.get();
	private Author a;
	private Content<String> c;
	
	@Before
	public void setup() {
		this.a = Author.getNewAuthor("il gabibbo");
		this.c = builder.withContent("belandi").withAuthor(a).build();
	}
	
	@Test
	public void orphan() {
		assertThat(c.version().parent()).isEqualTo(c.version());
	}
	
	@Test
	public void testSymmetry() {
		assertThat(c).isEqualTo(c.version().content());
		assertThat(c.show()).isEqualTo(c.version().content().show());
	}
	
	@Test
	public void versionTest() {
		StringContent.builder builder = StringContent.builder.get();
		Content<String> copiedContent = builder.buildFrom(c);
		assertThat(copiedContent.version().parent()).isEqualTo(c.version());
		assertThat(c.version().children()).contains(copiedContent.version());
		
	}


}
